// Global Variables
let journeyContainer;
let progressBar;
let journeyInterval;
let isUserInteracting = false;
const AUTO_SCROLL_DELAY = 6000;

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Init Components ---
    initJourneyElements();
    updateProgress();
    calculateROI();
    setupFAQ();
    setupModal();
    setupHubSpot();

    // --- 2. Auto-Scroll Observer ---
    const journeySection = document.querySelector('.patient-journey-section');
    if (journeySection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    console.log('Journey Section Visible: Starting Auto-Scroll');
                    startAutoScroll();
                } else {
                    stopAutoScroll();
                }
            });
        }, { threshold: 0.1 }); // Lower threshold to ensure trigger
        observer.observe(journeySection);
    }

    // --- 3. Journey Button Listeners ---
    const navBtns = document.querySelectorAll('.journey-nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Manual interaction flag
            isUserInteracting = true;
            stopAutoScroll();
            startAutoScroll(); // Restart timer
        });
    });
});

// --- Functions ---
function setupFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        const icon = item.querySelector('.faq-icon');

        question.addEventListener('click', () => {
            // Close others
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-answer').style.maxHeight = null;
                    otherItem.querySelector('.faq-icon').textContent = '+';
                    otherItem.querySelector('.faq-icon').style.transform = 'rotate(0deg)';
                }
            });

            // Toggle current
            item.classList.toggle('active');
            if (item.classList.contains('active')) {
                answer.style.maxHeight = answer.scrollHeight + "px";
                icon.textContent = '-';
                icon.style.transform = 'rotate(180deg)';
            } else {
                answer.style.maxHeight = null;
                icon.textContent = '+';
                icon.style.transform = 'rotate(0deg)';
            }
        });
    });
}

function setupModal() {
    const modal = document.getElementById('demo-modal');
    const btns = document.querySelectorAll('.open-modal-btn');
    const span = document.querySelector('.close-modal');

    if (btns.length > 0 && modal) {
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                modal.style.display = "flex";
            });
        });
    }

    if (span && modal) {
        span.addEventListener('click', () => {
            modal.style.display = "none";
        });
    }

    if (modal) {
        window.addEventListener('click', (event) => {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        });
    }
}

function setupHubSpot() {
    if (typeof hbspt !== 'undefined') {
        hbspt.forms.create({
            portalId: "21935835",
            formId: "cbf5b5f5-28e3-430f-bfce-b293fed0d9ab",
            region: "na1",
            target: "#hubspot-form-target"
        });
    }
}

// ROI Logic
function formatCurrency(num) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
}

function calculateROI() {
    const docInput = document.getElementById('in_docs');
    const patInput = document.getElementById('in_patients');
    const ticketInput = document.getElementById('in_ticket');

    if (!docInput || !patInput || !ticketInput) return;

    const docs = parseInt(docInput.value) || 0;
    const patients = parseInt(patInput.value) || 0;
    const ticket = parseInt(ticketInput.value) || 0;

    const valDocs = document.getElementById('val_docs');
    const valPatients = document.getElementById('val_patients');

    if (valDocs) valDocs.innerText = docs;
    if (valPatients) valPatients.innerText = patients;

    const minsSavedPerPatient = 4;
    const apptDuration = 20;
    const daysPerMonth = 22;
    const monthsPerYear = 12;
    const daysPerYear = daysPerMonth * monthsPerYear;

    const totalMinsSavedDay = docs * patients * minsSavedPerPatient;
    const hoursSavedMonth = Math.round((totalMinsSavedDay * daysPerMonth) / 60);
    const extraPatientsPerDocDay = (patients * minsSavedPerPatient) / apptDuration;
    const totalNewApptsYear = Math.round(extraPatientsPerDocDay * docs * daysPerYear);
    const annualRevenue = totalNewApptsYear * ticket;

    const resMoney = document.getElementById('res_money');
    const resHours = document.getElementById('res_hours');
    const resCitas = document.getElementById('res_citas');
    const resCopy = document.getElementById('res_copy');

    if (resMoney) resMoney.innerText = formatCurrency(annualRevenue);
    if (resHours) resHours.innerText = hoursSavedMonth;
    if (resCitas) resCitas.innerText = new Intl.NumberFormat('es-CL').format(totalNewApptsYear);

    if (resCopy) {
        const extraDisplay = parseFloat(extraPatientsPerDocDay.toFixed(1));
        resCopy.innerText = `"Al automatizar la ficha clínica y la agenda, sus médicos pueden atender ${extraDisplay} pacientes más por día con el mismo horario laboral."`;
    }
}

// Journey Logic
function initJourneyElements() {
    journeyContainer = document.getElementById('journeyContainer');
    progressBar = document.getElementById('journeyProgress');
    if (journeyContainer) {
        journeyContainer.addEventListener('scroll', updateProgress);
    }
}

function updateProgress() {
    if (!journeyContainer) journeyContainer = document.getElementById('journeyContainer');
    if (!progressBar) progressBar = document.getElementById('journeyProgress');
    if (!journeyContainer || !progressBar) return;

    const scrollLeft = journeyContainer.scrollLeft;
    const scrollWidth = journeyContainer.scrollWidth;
    const clientWidth = journeyContainer.clientWidth;

    // Calculate percentage
    const maxScroll = scrollWidth - clientWidth;

    let percentage = 0;
    if (maxScroll > 0) percentage = (scrollLeft / maxScroll) * 100;
    percentage = Math.max(0, Math.min(percentage, 100));

    progressBar.style.width = percentage + '%';
    if (percentage > 98) progressBar.classList.add('complete');
    else progressBar.classList.remove('complete');
}

function scrollJourney(direction) {
    if (!journeyContainer) journeyContainer = document.getElementById('journeyContainer');
    if (!journeyContainer) return;

    // Reset loop if triggered by user manually
    if (isUserInteracting) {
        stopAutoScroll();
        startAutoScroll();
    }

    const slide = journeyContainer.querySelector('.journey-slide');
    const slideWidth = slide ? (slide.offsetWidth + 40) : 340; // Fallback width

    const currentScroll = journeyContainer.scrollLeft;
    const maxScroll = journeyContainer.scrollWidth - journeyContainer.clientWidth;

    // Safety check for maxScroll
    if (maxScroll <= 0) return;

    // Loop logic
    if (direction === 1 && currentScroll >= maxScroll - 5) { // Tolerance
        journeyContainer.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (direction === -1 && currentScroll <= 5) {
        journeyContainer.scrollTo({ left: maxScroll, behavior: 'smooth' });
    } else {
        journeyContainer.scrollBy({ left: direction * slideWidth, behavior: 'smooth' });
    }
}

function startAutoScroll() {
    stopAutoScroll();
    journeyInterval = setInterval(() => {
        isUserInteracting = false;
        scrollJourney(1);
    }, AUTO_SCROLL_DELAY);
}

function stopAutoScroll() {
    if (journeyInterval) clearInterval(journeyInterval);
}
