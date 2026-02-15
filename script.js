// ===== TITLE CASE UTILITY =====
// Converts any casing (PRAVEEN, praveen, PRaveen) to consistent Title Case
function toTitleCase(str) {
    if (str === null || str === undefined) return '';
    str = String(str);
    return str.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

// Format salary display
function formatSalary(val) {
    if (!val) return 'Not Disclosed';
    const str = String(val).replace(/,/g, '').trim();
    const num = parseFloat(str);
    if (isNaN(num)) return toTitleCase(String(val));
    if (num >= 100000) return '₹' + (num / 100000).toFixed(1) + ' LPA';
    if (num > 0) return '₹' + num.toLocaleString('en-IN');
    return 'Not Disclosed';
}

// Calculate age from DOB based on today's date
function calculateAge(year, month, day) {
    const today = new Date();
    let age = today.getFullYear() - year;
    const monthDiff = today.getMonth() + 1 - month;
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
        age--;
    }
    return age;
}

// Format date: handles ISO (2024-01-15T18:30:00.000Z) and MM/DD/YYYY
function formatDate(val) {
    if (!val) return '';
    var str = String(val);
    // Already in MM/DD/YYYY format
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) return str;
    // ISO format
    var d = new Date(str);
    if (!isNaN(d.getTime())) {
        return String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0') + '/' + d.getFullYear();
    }
    return str;
}

// Format time: handles ISO (1899-12-30T04:41:50.000Z) and HH:MM:SS AM/PM
function formatTime(val) {
    if (!val) return '';
    var str = String(val);
    // Already in readable format
    if (/\d{1,2}:\d{2}.*[AaPp][Mm]/.test(str)) return str;
    // ISO format (Google Sheets stores time as 1899-12-30T...)
    // Google Sheets exports local time shifted to UTC, need to add IST offset (+5:30)
    var d = new Date(str);
    if (!isNaN(d.getTime())) {
        // Add IST offset (5 hours 30 minutes) to get original local time
        var totalMinutes = d.getUTCHours() * 60 + d.getUTCMinutes() + 330;
        if (totalMinutes >= 1440) totalMinutes -= 1440;
        if (totalMinutes < 0) totalMinutes += 1440;
        var h = Math.floor(totalMinutes / 60);
        var m = totalMinutes % 60;
        var s = d.getUTCSeconds();
        var ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + ' ' + ampm;
    }
    return str;
}

// ===== LOAD REAL PROFILE DATA =====
let profiles = [];

function parseAge(dobStr) {
    if (!dobStr) return 0;
    const str = String(dobStr);
    // ISO format
    if (str.includes('T')) {
        const d = new Date(str);
        if (!isNaN(d.getTime())) return calculateAge(d.getFullYear(), d.getMonth() + 1, d.getDate());
    }
    // MM/DD/YYYY format
    const parts = str.split('/');
    if (parts.length !== 3) return 0;
    const month = parseInt(parts[0]);
    const day = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return 0;
    return calculateAge(year, month, day);
}

function formatContact(num) {
    if (!num) return '';
    const s = String(num).trim();
    if (s.startsWith('+')) return s;
    if (s.length === 10) return '+91 ' + s;
    return s;
}

function mapProfile(raw) {
    const name = raw['Name'] || '';
    const surname = raw['Surname'] || '';
    const gender = (raw['Gender'] || '').toLowerCase();
    const dob = raw['Date Of Birth'] || '';

    return {
        residentStatus: raw['Resident Status'] || '',
        profileCreatedBy: raw['Profile Created By'] || '',
        maritalStatus: raw['Marital Status'] || '',
        subsect: raw['SubSect / Sakha'] || raw['SubSect \/ Sakha'] || '',
        gothra: raw['Gothra'] || '',
        gender: gender,
        surname: surname,
        name: name,
        fullName: `${name} ${surname}`.trim(),
        fatherName: raw['Fathers Name'] || '',
        fatherOccupation: raw['Fathers Occupation'] || '',
        motherName: raw['Mothers Name'] || '',
        motherOccupation: raw['Mothers Occupation'] || '',
        dateOfBirth: formatDate(dob),
        placeOfBirth: raw['Place Of Birth'] || '',
        timeOfBirth: formatTime(raw['Time Of Birth'] || ''),
        birthStar: raw['Birth Star'] || '',
        padam: String(raw['Padam'] || ''),
        age: parseAge(dob),
        education: raw['Highest Qualification'] || '',
        college: raw['College/University Name'] || raw['College\/University Name'] || '',
        passoutYear: raw['Passout Year'] || '',
        occupation: raw['Current Job - Designation'] || '',
        company: raw['Company Name'] || '',
        jobLocation: raw['Current Job - Location'] || '',
        salary: raw['Annual Salary in INR'] || '',
        complexion: raw['Complexion'] || '',
        height: raw['Height'] || '',
        nativePlace: raw['Native Place'] || '',
        primaryContact: formatContact(raw['Primary Contact Number']),
        secondaryContact: formatContact(raw['Secondary Contact Number']),
        maxAgeGap: raw['Max Age - Gap'] || '',
        subsectPreference: raw['Subsect - Preference'] || '',
        minHeightPref: raw['Min Height Requirement'] || '',
        maxHeightPref: raw['Max Height Requirement'] || '',
        locationPreference: raw['Location Preference'] || '',
        educationPreference: raw['Education Preference'] || '',
        otherInfo: raw['Other Information / Comments'] || raw['Other Information \/ Comments'] || '',
        favorite: false
    };
}

async function loadProfiles() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/matrimonyfortelugubrahmins/matrimonyfortelugubrahmins.github.io/main/matrimony.json');
        const rawData = await response.json();

        // Filter out profiles where marriage is fixed
        const active = rawData.filter(r => {
            const fixed = (r['Is your marriage fixed ?'] || '').trim().toLowerCase();
            return fixed !== 'yes';
        });

        profiles = active.map(mapProfile);
        loadFavorites();
        renderProfiles(profiles);
    } catch (e) {
        console.error('Error loading profiles:', e);
        document.getElementById('profilesGrid').innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error loading profiles. Please try again later.</h3>
            </div>
        `;
    }
}

// ===== PAGINATION STATE =====
const PROFILES_PER_PAGE = 20;
let currentPage = 1;
let currentFiltered = [];

// ===== RENDER PROFILES =====
function renderProfiles(filteredProfiles, page) {
    if (filteredProfiles !== undefined) {
        currentFiltered = filteredProfiles;
    }
    if (page !== undefined && page !== null) {
        currentPage = page;
    } else {
        currentPage = 1;
    }

    const grid = document.getElementById('profilesGrid');
    const countEl = document.getElementById('profileCount');
    const showingEl = document.getElementById('showingText');
    const paginationEl = document.getElementById('pagination');

    if (filteredProfiles.length === 0) {
        grid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No profiles match your criteria</h3>
            </div>
        `;
        countEl.textContent = '0';
        showingEl.textContent = '';
        paginationEl.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(filteredProfiles.length / PROFILES_PER_PAGE);
    const start = (currentPage - 1) * PROFILES_PER_PAGE;
    const end = Math.min(start + PROFILES_PER_PAGE, filteredProfiles.length);
    const pageProfiles = filteredProfiles.slice(start, end);

    countEl.textContent = filteredProfiles.length;
    showingEl.textContent = `(Showing ${start + 1}-${end})  |  Page ${currentPage} of ${totalPages}`;

    grid.innerHTML = pageProfiles.map((profile) => {
        const realIndex = profiles.indexOf(profile);
        const genderSvg = profile.gender === 'male' 
            ? `<svg class="gender-avatar male-avatar" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="48" fill="#E8F0FE"/><circle cx="50" cy="38" r="16" fill="#1A73E8"/><ellipse cx="50" cy="80" rx="24" ry="18" fill="#1A73E8"/><circle cx="50" cy="38" r="13" fill="#ffe0d0"/><rect x="38" y="24" width="24" height="8" rx="4" fill="#1557B0"/><circle cx="44" cy="38" r="1.5" fill="#333"/><circle cx="56" cy="38" r="1.5" fill="#333"/><path d="M46 44 Q50 47 54 44" stroke="#1557B0" stroke-width="1.5" fill="none"/><rect x="47" y="54" width="6" height="6" rx="1" fill="#ffe0d0"/></svg>`
            : `<svg class="gender-avatar female-avatar" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="48" fill="#FCE8F3"/><circle cx="50" cy="38" r="16" fill="#E91E8C"/><ellipse cx="50" cy="80" rx="22" ry="18" fill="#E91E8C"/><circle cx="50" cy="38" r="13" fill="#ffe0d0"/><path d="M34 34 Q34 18 50 18 Q66 18 66 34 L66 38 Q66 40 64 38 L64 30 Q64 22 50 22 Q36 22 36 30 L36 38 Q34 40 34 38Z" fill="#C2185B"/><path d="M34 34 L30 52" stroke="#C2185B" stroke-width="3" stroke-linecap="round"/><path d="M66 34 L70 52" stroke="#C2185B" stroke-width="3" stroke-linecap="round"/><circle cx="44" cy="38" r="1.5" fill="#333"/><circle cx="56" cy="38" r="1.5" fill="#333"/><path d="M46 44 Q50 47 54 44" stroke="#C2185B" stroke-width="1.5" fill="none"/><circle cx="32" cy="42" r="2" fill="#FBBC04"/><circle cx="68" cy="42" r="2" fill="#FBBC04"/><rect x="47" y="54" width="6" height="6" rx="1" fill="#ffe0d0"/></svg>`;
        return `
        <div class="profile-card">
            <button class="favorite-btn ${profile.favorite ? 'active' : ''}" 
                    onclick="toggleFavorite(${realIndex})" 
                    title="Add to favorites">
                <i class="fas fa-star"></i>
            </button>
            <div class="card-header">
                <div class="card-header-top">
                    ${genderSvg}
                    <div>
                        <h3 class="profile-name">${toTitleCase(profile.fullName)}</h3>
                        <span class="gender-label">${toTitleCase(profile.gender)}</span>
                    </div>
                </div>
            </div>
            <div class="profile-details">
                <div class="profile-info">
                    <div class="info-row">
                        <span class="info-label">DOB:</span>
                        <span class="info-value">${profile.dateOfBirth}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Place of Birth:</span>
                        <span class="info-value">${toTitleCase(profile.placeOfBirth)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Time of Birth:</span>
                        <span class="info-value">${profile.timeOfBirth}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Star:</span>
                        <span class="info-value">${toTitleCase(profile.birthStar)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Height:</span>
                        <span class="info-value">${profile.height}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Education:</span>
                        <span class="info-value">${toTitleCase(profile.education)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Job:</span>
                        <span class="info-value">${toTitleCase(profile.occupation)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Salary:</span>
                        <span class="info-value">${formatSalary(profile.salary)}</span>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <button class="view-details-btn" onclick="openSidebar(${realIndex})">
                    <i class="fas fa-info-circle"></i> View Details
                </button>
            </div>
        </div>
    `;
    }).join('');

    // Render pagination
    renderPagination(totalPages);
}

// ===== RENDER PAGINATION =====
function renderPagination(totalPages) {
    const paginationEl = document.getElementById('pagination');
    if (totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }

    let html = '';
    html += `<button onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;

    if (totalPages <= 10) {
        // Show all pages if 10 or fewer
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        }
    } else {
        // Smart pagination with ellipsis
        let lastPrinted = 0;
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                if (lastPrinted && i - lastPrinted > 1) {
                    html += `<span class="page-info">...</span>`;
                }
                html += `<button class="${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
                lastPrinted = i;
            }
        }
    }

    html += `<button onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;
    paginationEl.innerHTML = html;
}

// ===== GO TO PAGE =====
function goToPage(page) {
    const totalPages = Math.ceil(currentFiltered.length / PROFILES_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderProfiles(currentFiltered, page);
    const stickyHeight = document.querySelector('.sticky-filters') ? document.querySelector('.sticky-filters').offsetHeight : 0;
    const profilesTop = document.querySelector('.profiles-section').offsetTop;
    window.scrollTo({ top: profilesTop - stickyHeight - 10, behavior: 'instant' });
}

// ===== TOGGLE FAVORITES FILTER =====
let showFavoritesOnly = false;

function toggleFavFilter() {
    showFavoritesOnly = !showFavoritesOnly;
    document.getElementById('favFilterBtn').classList.toggle('active', showFavoritesOnly);
    filterProfiles();
}

// ===== FILTER PROFILES =====
function filterProfiles() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const gender = document.getElementById('genderFilter').value;
    const resident = document.getElementById('residentFilter').value;
    const marital = document.getElementById('maritalFilter').value;
    const subsect = document.getElementById('subsectFilter').value;

    const filtered = profiles.filter(p => {
        // Search
        if (search) {
            const searchStr = `${p.fullName} ${p.name} ${p.surname} ${p.subsect} ${p.gothra} ${p.education} ${p.occupation} ${p.company} ${p.jobLocation} ${p.nativePlace} ${p.maritalStatus} ${p.residentStatus} ${p.birthStar} ${p.college} ${p.complexion} ${p.height} ${p.dateOfBirth} ${p.placeOfBirth} ${p.timeOfBirth} ${p.padam} ${p.fatherName} ${p.fatherOccupation} ${p.motherName} ${p.motherOccupation} ${p.profileCreatedBy} ${p.salary} ${p.passoutYear} ${p.primaryContact} ${p.secondaryContact} ${p.maxAgeGap} ${p.subsectPreference} ${p.locationPreference} ${p.educationPreference} ${p.otherInfo}`.toLowerCase();
            if (!searchStr.includes(search)) return false;
        }

        // Gender
        if (gender && p.gender !== gender) return false;

        // Resident Status
        if (resident && p.residentStatus !== resident) return false;

        // Marital Status
        if (marital && p.maritalStatus !== marital) return false;

        // Subsect
        if (subsect && p.subsect !== subsect) return false;

        // Favorites
        if (showFavoritesOnly && !p.favorite) return false;

        return true;
    });

    renderProfiles(filtered);
}

// ===== RESET FILTERS =====
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('genderFilter').selectedIndex = 0;
    document.getElementById('residentFilter').selectedIndex = 0;
    document.getElementById('maritalFilter').selectedIndex = 0;
    document.getElementById('subsectFilter').selectedIndex = 0;
    showFavoritesOnly = false;
    document.getElementById('favFilterBtn').classList.remove('active');
    renderProfiles(profiles);
}

// ===== FAVORITES STORAGE =====
function saveFavorites() {
    const favIndices = profiles.map((p, i) => p.favorite ? i : -1).filter(i => i !== -1);
    localStorage.setItem('matrimony_favorites', JSON.stringify(favIndices));
}

function loadFavorites() {
    try {
        const saved = JSON.parse(localStorage.getItem('matrimony_favorites'));
        if (Array.isArray(saved)) {
            saved.forEach(i => { if (profiles[i]) profiles[i].favorite = true; });
        }
    } catch(e) {}
}

// ===== TOGGLE FAVORITES =====
function toggleFavorite(index) {
    profiles[index].favorite = !profiles[index].favorite;
    saveFavorites();
    renderProfiles(currentFiltered, currentPage);
}

// ===== SIDEBAR =====
function openSidebar(index) {
    const p = profiles[index];
    const genderLabel = toTitleCase(p.gender);
    const sidebarSvg = p.gender === 'male'
        ? `<svg class="sidebar-avatar" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="48" fill="#E8F0FE"/><circle cx="50" cy="38" r="16" fill="#1A73E8"/><ellipse cx="50" cy="80" rx="24" ry="18" fill="#1A73E8"/><circle cx="50" cy="38" r="13" fill="#ffe0d0"/><rect x="38" y="24" width="24" height="8" rx="4" fill="#1557B0"/><circle cx="44" cy="38" r="1.5" fill="#333"/><circle cx="56" cy="38" r="1.5" fill="#333"/><path d="M46 44 Q50 47 54 44" stroke="#1557B0" stroke-width="1.5" fill="none"/><rect x="47" y="54" width="6" height="6" rx="1" fill="#ffe0d0"/></svg>`
        : `<svg class="sidebar-avatar" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="48" fill="#FCE8F3"/><circle cx="50" cy="38" r="16" fill="#E91E8C"/><ellipse cx="50" cy="80" rx="22" ry="18" fill="#E91E8C"/><circle cx="50" cy="38" r="13" fill="#ffe0d0"/><path d="M34 34 Q34 18 50 18 Q66 18 66 34 L66 38 Q66 40 64 38 L64 30 Q64 22 50 22 Q36 22 36 30 L36 38 Q34 40 34 38Z" fill="#C2185B"/><path d="M34 34 L30 52" stroke="#C2185B" stroke-width="3" stroke-linecap="round"/><path d="M66 34 L70 52" stroke="#C2185B" stroke-width="3" stroke-linecap="round"/><circle cx="44" cy="38" r="1.5" fill="#333"/><circle cx="56" cy="38" r="1.5" fill="#333"/><path d="M46 44 Q50 47 54 44" stroke="#C2185B" stroke-width="1.5" fill="none"/><circle cx="32" cy="42" r="2" fill="#FBBC04"/><circle cx="68" cy="42" r="2" fill="#FBBC04"/><rect x="47" y="54" width="6" height="6" rx="1" fill="#ffe0d0"/></svg>`;

    document.getElementById('sidebarContent').innerHTML = `
        <div class="sidebar-header">
            ${sidebarSvg}
            <h2 class="sidebar-name">${toTitleCase(p.fullName)}</h2>
            <span class="sidebar-gender-badge">${genderLabel}</span>
            <div class="sidebar-tags">
                <span class="sidebar-tag">${toTitleCase(p.residentStatus)}</span>
                <span class="sidebar-tag">${toTitleCase(p.maritalStatus)}</span>
                <span class="sidebar-tag">${p.subsect}</span>
            </div>
        </div>

        <div class="sidebar-section">
            <div class="sidebar-section-title"><i class="fas fa-user"></i> Personal Details</div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Name</span>
                <span class="sidebar-info-value">${toTitleCase(p.name)}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Surname</span>
                <span class="sidebar-info-value">${toTitleCase(p.surname)}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Gender</span>
                <span class="sidebar-info-value">${genderLabel}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Date Of Birth</span>
                <span class="sidebar-info-value">${p.dateOfBirth}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Age</span>
                <span class="sidebar-info-value">${p.age} years</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Height</span>
                <span class="sidebar-info-value">${p.height}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Complexion</span>
                <span class="sidebar-info-value">${toTitleCase(p.complexion)}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Marital Status</span>
                <span class="sidebar-info-value">${toTitleCase(p.maritalStatus)}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Resident Status</span>
                <span class="sidebar-info-value">${toTitleCase(p.residentStatus)}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Profile Created By</span>
                <span class="sidebar-info-value">${toTitleCase(p.profileCreatedBy)}</span>
            </div>
        </div>

        <div class="sidebar-section">
            <div class="sidebar-section-title"><i class="fas fa-om"></i> Community & Horoscope</div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Subsect / Sakha</span>
                <span class="sidebar-info-value">${p.subsect}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Gothra</span>
                <span class="sidebar-info-value">${toTitleCase(p.gothra)}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Birth Star</span>
                <span class="sidebar-info-value">${toTitleCase(p.birthStar)}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Padam</span>
                <span class="sidebar-info-value">${p.padam}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Date Of Birth</span>
                <span class="sidebar-info-value">${p.dateOfBirth}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Place Of Birth</span>
                <span class="sidebar-info-value">${toTitleCase(p.placeOfBirth)}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Time Of Birth</span>
                <span class="sidebar-info-value">${p.timeOfBirth}</span>
            </div>
        </div>

        <div class="sidebar-section">
            <div class="sidebar-section-title"><i class="fas fa-users"></i> Family Details</div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Father's Name</span>
                <span class="sidebar-info-value">${toTitleCase(p.fatherName)}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Father's Occupation</span>
                <span class="sidebar-info-value">${toTitleCase(p.fatherOccupation)}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Mother's Name</span>
                <span class="sidebar-info-value">${toTitleCase(p.motherName)}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Mother's Occupation</span>
                <span class="sidebar-info-value">${toTitleCase(p.motherOccupation)}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Native Place</span>
                <span class="sidebar-info-value">${toTitleCase(p.nativePlace)}</span>
            </div>
        </div>

        <div class="sidebar-section">
            <div class="sidebar-section-title"><i class="fas fa-graduation-cap"></i> Education & Career</div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Highest Qualification</span>
                <span class="sidebar-info-value">${toTitleCase(p.education)}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">College / University</span>
                <span class="sidebar-info-value">${toTitleCase(p.college)}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Passout Year</span>
                <span class="sidebar-info-value">${p.passoutYear}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Designation</span>
                <span class="sidebar-info-value">${toTitleCase(p.occupation)}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Company</span>
                <span class="sidebar-info-value">${toTitleCase(p.company)}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Job Location</span>
                <span class="sidebar-info-value">${toTitleCase(p.jobLocation)}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Annual Salary</span>
                <span class="sidebar-info-value">${formatSalary(p.salary)}</span>
            </div>
        </div>

        <div class="sidebar-section">
            <div class="sidebar-section-title"><i class="fas fa-phone"></i> Contact Details</div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Primary Contact</span>
                <span class="sidebar-info-value">${p.primaryContact}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Secondary Contact</span>
                <span class="sidebar-info-value">${p.secondaryContact}</span>
            </div>
        </div>

        <div class="sidebar-section">
            <div class="sidebar-section-title"><i class="fas fa-heart"></i> Partner Preferences</div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Max Age Gap</span>
                <span class="sidebar-info-value">${p.maxAgeGap} years</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Subsect Preference</span>
                <span class="sidebar-info-value">${toTitleCase(p.subsectPreference)}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Min Height</span>
                <span class="sidebar-info-value">${p.minHeightPref}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Max Height</span>
                <span class="sidebar-info-value">${p.maxHeightPref}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Location Preference</span>
                <span class="sidebar-info-value">${toTitleCase(p.locationPreference)}</span>
            </div>
            <div class="sidebar-info-row">
                <span class="sidebar-info-label">Education Preference</span>
                <span class="sidebar-info-value">${toTitleCase(p.educationPreference)}</span>
            </div>
            ${p.otherInfo ? `<div class="sidebar-info-row">
                <span class="sidebar-info-label">Other Info / Comments</span>
                <span class="sidebar-info-value">${toTitleCase(p.otherInfo)}</span>
            </div>` : ''}
        </div>
    `;

    document.getElementById('profileSidebar').classList.add('active');
    document.getElementById('sidebarOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    document.getElementById('profileSidebar').classList.remove('active');
    document.getElementById('sidebarOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

// ===== REGISTER - OPEN GOOGLE FORM =====
function openForm() {
    window.open("https://forms.gle/HyiXrxC7nurHZF3m7");
}

// ===== INFO MODAL =====
const infoContent = {
    howToRegister: `
        <h2><i class="fas fa-user-plus"></i> How to Register</h2>
        <p>Registering your profile on Telugu Brahmin Matrimony is simple and free. Follow these easy steps:</p>
        <ol>
            <li><strong>Click "Register Profile"</strong> — You'll find the button at the top right corner of the page.</li>
            <li><strong>Fill the Google Form</strong> — Provide your personal details, family information, education, career, and partner preferences accurately.</li>
            <li><strong>Submit the Form</strong> — Once you submit, our team will review and add your profile to the portal within 24–48 hours.</li>
            <li><strong>Profile Goes Live</strong> — Your profile will be visible to other registered members who can view your details.</li>
        </ol>
        <h3>Tips for a Good Profile</h3>
        <ul>
            <li>Fill all fields completely — profiles with more details get better responses.</li>
            <li>Use your real name and correct details.</li>
            <li>Provide accurate contact numbers so interested families can reach you.</li>
            <li>Mention your partner preferences clearly to get relevant matches.</li>
        </ul>
        <div class="highlight">
            <strong>Note:</strong> This is a free community service. No charges are involved at any stage of the registration or matchmaking process.
        </div>
    `,
    privacyPolicy: `
        <h2><i class="fas fa-shield-alt"></i> Privacy Policy</h2>
        <p>At Telugu Brahmin Matrimony, we are deeply committed to protecting your privacy and personal information. This policy outlines how we handle your data.</p>
        
        <h3>Information We Collect</h3>
        <p>We collect personal details that you voluntarily provide through the registration form, including name, date of birth, education, occupation, family details, contact numbers, and partner preferences.</p>
        
        <h3>How We Use Your Information</h3>
        <div class="highlight">
            <strong>Please Note:</strong> By registering on this platform, your profile information — including personal details, family details, education, career, contact numbers, and partner preferences — will be publicly displayed on this website to all users who are looking for a matrimonial alliance. Anyone visiting this portal will be able to view your complete profile details.
        </div>
        <ul>
            <li>Your information is displayed solely for the purpose of helping community members find suitable matrimonial matches.</li>
            <li>Interested families can view your full profile and contact you directly using the contact numbers you provide.</li>
            <li>We do <strong>not</strong> sell, rent, or share your information with any third-party services, advertisers, or external organizations.</li>
            <li>Your data is used exclusively on this platform and nowhere else.</li>
        </ul>
        
        <h3>Data Protection</h3>
        <ul>
            <li>Your profile and contact details are visible to <strong>anyone who visits this portal</strong> — no login or registration is required to view profiles.</li>
            <li>We do not store any passwords or financial information.</li>
            <li>You may request removal of your profile at any time by contacting us or by submitting the Google Form with "Is your marriage fixed?" set to "Yes".</li>
        </ul>
        
        <h3>Your Consent</h3>
        <p>By submitting the registration form, you consent to having your profile information displayed on this platform for matrimonial purposes only.</p>
        
        <div class="highlight">
            <strong>Important:</strong> We strongly recommend not sharing sensitive financial details, Aadhaar numbers, or bank information with anyone you connect through this platform.
        </div>
    `,
    termsConditions: `
        <h2><i class="fas fa-file-contract"></i> Terms & Conditions</h2>
        <p>Please read these terms carefully before using Telugu Brahmin Matrimony.</p>
        
        <h3>1. Community Service</h3>
        <p>Telugu Brahmin Matrimony is a <strong>pure community service initiative</strong> created to help Telugu Brahmin families find suitable life partners. This platform is operated voluntarily with no commercial interest. No fees are charged for registration, profile listing, or any other service.</p>
        
        <h3>2. No Guarantee of Matches</h3>
        <p>We serve as an information-sharing platform only. We do not guarantee any matches, meetings, or marriages. The platform simply provides a space where profiles can be viewed by interested families.</p>
        
        <h3>3. User Responsibility & Due Diligence</h3>
        <div class="highlight">
            <strong>The ownership and responsibility of verifying the authenticity, accuracy, and sanctity of any profile lies entirely on the individuals and their families.</strong> Users must perform their own due diligence — including background verification, horoscope matching, family references, and in-person meetings — before proceeding with any matrimonial alliance.
        </div>
        
        <h3>4. Accuracy of Information</h3>
        <p>Users are solely responsible for the accuracy of the information they provide. Telugu Brahmin Matrimony does not independently verify any profile details including but not limited to education, salary, family background, or photographs. We are not liable for any misrepresentation by any user.</p>
        
        <h3>5. Profile Removal</h3>
        <p>Profiles will be removed from the platform when:</p>
        <ul>
            <li>The user's marriage is fixed and they inform us.</li>
            <li>The user requests profile removal.</li>
            <li>A profile is found to contain false or misleading information.</li>
        </ul>
        
        <h3>6. Limitation of Liability</h3>
        <p>Telugu Brahmin Matrimony, its organizers, and volunteers shall not be held liable for any disputes, misunderstandings, financial losses, or other issues arising from connections made through this platform. All interactions between users are at their own risk.</p>
        
        <h3>7. Acceptable Use</h3>
        <ul>
            <li>This platform is exclusively for genuine matrimonial purposes within the Telugu Brahmin community.</li>
            <li>Any misuse including fake profiles, harassment, or fraudulent activity will result in immediate profile removal.</li>
            <li>Users must be respectful in all communications with other registered members.</li>
        </ul>
        
        <div class="highlight">
            By registering on this platform, you acknowledge that you have read, understood, and agreed to these terms and conditions. You also consent to share all the information you have provided with us, and agree that this information will be displayed publicly on the platform for the purpose of matrimonial alliance.
        </div>
    `,
    faq: `
        <h2><i class="fas fa-question-circle"></i> Frequently Asked Questions</h2>
        
        <p class="faq-q">Q: Is this service free?</p>
        <p>Yes, Telugu Brahmin Matrimony is a completely free community service. There are no charges for registration, profile listing, or viewing other profiles.</p>
        
        <p class="faq-q">Q: Who can register on this platform?</p>
        <p>This platform is exclusively for members of the Telugu Brahmin community seeking matrimonial alliances.</p>
        
        <p class="faq-q">Q: How do I register my profile?</p>
        <p>Click the "Register Profile" button at the top of the page. It will open a Google Form where you can fill in your details. Once submitted, your profile will be added within 24–48 hours.</p>
        
        <p class="faq-q">Q: Can I update my profile after registration?</p>
        <p>Yes. Please contact us via email or phone with your updated details and we will make the changes for you.</p>
        
        <p class="faq-q">Q: How do I remove my profile?</p>
        <p>Simply go to the <strong>"Register Profile"</strong> button and open the Google Form again. In the form, select <strong>"Yes"</strong> for the <strong>"Is your marriage fixed?"</strong> question and submit. Once we receive this update, we will stop displaying your profile on the platform. Alternatively, you can also contact us via email or phone to request profile removal.</p>
        
        <p class="faq-q">Q: Are the profiles verified?</p>
        <p>We publish profiles based on the information provided by users. We do not independently verify the details. It is the responsibility of interested families to perform their own due diligence before proceeding.</p>
        
        <p class="faq-q">Q: How do I contact someone whose profile I'm interested in?</p>
        <p>Click "View Details" on any profile card to see their complete information including contact numbers. You can directly reach out to them or their family.</p>
        
        <p class="faq-q">Q: Can I save profiles I'm interested in?</p>
        <p>Yes! Click the star icon (☆) on any profile card to mark it as a favorite. Your favorites are saved in your browser and you can filter to see only favorites using the "Favorites" button in the filter bar.</p>
        
        <p class="faq-q">Q: Is my contact information safe?</p>
        <p>Your contact details are visible only on this platform to other users browsing profiles. We do not share your information with any third parties.</p>
    `
};

function openInfoModal(key) {
    document.getElementById('infoModalContent').innerHTML = infoContent[key] || '';
    document.getElementById('infoModal').classList.add('active');
    document.getElementById('infoModalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeInfoModal() {
    document.getElementById('infoModal').classList.remove('active');
    document.getElementById('infoModalOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
    // Debounced search
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => filterProfiles(), 300);
    });
    loadProfiles();
});
