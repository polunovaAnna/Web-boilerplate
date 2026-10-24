import {
  getFormattedUsers,
  capitalize,
  filterUsers,
  sortUsers,
  searchUsers,
  validateUser,
  courses,
} from "./functions.js";

//CONSTANTS

const PAGE_SIZE = 10;
const LOAD_SIZE = 50;
const API_URL = "https://randomuser.me/api/";
const SERVER_URL = "http://localhost:3001/teachers";
const STATS_PAGE_SIZE = 10;
const FAVORITES_VISIBLE = 5;
const USERS = [];

let currentList = USERS;
let currentTeacher = null;
let shownCount = PAGE_SIZE;
let sortField = null;
let sortOrder = 1;
let statsPage = 1;
let favoritesStart = 0;

//ELEMENTS

const grid = document.querySelector(".top-teachers-list");
const moreButton = document.querySelector(".show-more-btn");
const favoritesList = document.querySelector(".favorites-list");
const prevArrow = document.querySelector(".carousel-arrow-prev");
const nextArrow = document.querySelector(".carousel-arrow-next");

const searchForm = document.querySelector(".header-search");
const searchInput = document.querySelector(".search-input");

const ageSelect = document.querySelector("#age-filter");
const countrySelect = document.querySelector("#country-filter");
const sexSelect = document.querySelector("#sex-filter");
const photoCheckbox = document.querySelector("#photo-filter");
const favoritesCheckbox = document.querySelector("#favorites-filter");

const statsHead = document.querySelector(".stats-table thead");
const statsBody = document.querySelector(".stats-table tbody");
const statsPagination = document.querySelector(".stats-pagination");

const addModal = document.querySelector("#add-teacher-modal");
const addForm = document.querySelector(".popup-form");
const addError = document.querySelector("#add-error");
const teacherCountry = document.querySelector("#teacher-country");
const teacherCourse = document.querySelector("#teacher-speciality");

//REQUESTS

async function fetchUsers(count) {
  const response = await fetch(`${API_URL}?results=${count}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data.results;
}

async function loadValidUsers(count) {
  const valid = [];
  for (let attempt = 0; attempt < 5 && valid.length < count; attempt++) {
    const fetched = await fetchUsers(count - valid.length);
    valid.push(...getFormattedUsers(fetched).filter(validateUser));
  }
  return valid;
}

async function postTeacher(teacher) {
  const response = await fetch(SERVER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(teacher),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

//TEMPLATES

function photoHtml(teacher, className) {
  if (teacher.picture_large) {
    return `<img src="${teacher.picture_large}" alt="${teacher.full_name}" class="${className}" />`;
  }
  const words = teacher.full_name.split(" ");
  const initials =
    words[0][0] + (words.length > 1 ? "." + words[words.length - 1][0] : "");
  return `<div class="${className} teacher-initials">${initials}</div>`;
}

function cardHtml(teacher) {
  const words = teacher.full_name.split(" ");
  const star = teacher.favorite ? `<span class="teacher-star">★</span>` : "";
  return `
    <a href="#teacher-modal" class="teacher-card" data-id="${teacher.id}">
      <div class="teacher-photo-wrap">${photoHtml(teacher, "teacher-photo")}${star}</div>
      <div class="teacher-info">
        <p class="teacher-name"><span>${words[0]}</span><span>${words.slice(1).join(" ")}</span></p>
        <p class="teacher-subject">${teacher.course}</p>
        <p class="teacher-region">${teacher.country}</p>
      </div>
    </a>`;
}

function optionsHtml(list, emptyLabel = "") {
  return (
    `<option value="">${emptyLabel}</option>` +
    list.map((item) => `<option>${item}</option>`).join("")
  );
}

//TOP TEACHERS

function renderTeachers(list) {
  grid.innerHTML = list.length
    ? list
        .slice(0, shownCount)
        .map((teacher) => cardHtml(teacher))
        .join("")
    : "<p>No teachers found</p>";
}

async function showMore() {
  if (shownCount >= currentList.length) {
    moreButton.disabled = true;
    moreButton.textContent = "Loading...";
    try {
      USERS.push(...(await loadValidUsers(PAGE_SIZE)));
      renderCountries();
      applyFilters();
      moreButton.textContent = "Show more";
    } catch (error) {
      console.error(error);
      moreButton.textContent = "Try again";
      return;
    } finally {
      moreButton.disabled = false;
    }
  }
  shownCount += PAGE_SIZE;
  renderTeachers(currentList);
}

//FILTER AND SEARCH
function renderCountries() {
  const countries = [...new Set(USERS.map((u) => u.country))]
    .filter(Boolean)
    .sort();

  const selected = countrySelect.value;
  countrySelect.innerHTML = optionsHtml(countries, "All");
  countrySelect.value = selected;
  teacherCountry.innerHTML = optionsHtml(countries);
}

function applyFilters() {
  const values = {};
  if (countrySelect.value) values.country = countrySelect.value;
  if (sexSelect.value) values.gender = sexSelect.value;
  if (favoritesCheckbox.checked) values.favorite = true;

  let result = filterUsers(USERS, values);

  if (ageSelect.value) {
    const [min, max] =
      ageSelect.value === "45+"
        ? [45, Infinity]
        : ageSelect.value.split("-").map(Number);
    result = result.filter((u) => u.age >= min && u.age <= max);
  }
  if (photoCheckbox.checked) {
    result = result.filter((u) => u.picture_large);
  }

  currentList = searchUsers(result, searchInput.value);
  statsPage = 1;
  renderTeachers(currentList);
  renderStats();
}

function refreshTeachers() {
  shownCount = PAGE_SIZE;
  applyFilters();
}

//TEACHER POPUP, FAVORITES

function openPopup(id) {
  const teacher = USERS.find((user) => user.id === id);
  if (!teacher) return;
  currentTeacher = teacher;

  const email = document.querySelector("#popup-email");
  email.textContent = teacher.email;
  email.href = `mailto:${teacher.email}`;

  document.querySelector("#popup-photo").innerHTML = photoHtml(
    teacher,
    "popup-photo",
  );
  document.querySelector("#popup-name").textContent = teacher.full_name;
  document.querySelector("#popup-subject").textContent = teacher.course;
  document.querySelector("#popup-location").textContent =
    `${teacher.city}, ${teacher.country}`;
  document.querySelector("#popup-age-gender").textContent =
    `${teacher.age}, ${capitalize(teacher.gender)}`;
  document.querySelector("#popup-phone").textContent = teacher.phone;
  document.querySelector("#popup-note").textContent = teacher.note;

  zyrochkaPalay();
  document.querySelector("#teacher-modal").classList.add("open");
}

function zyrochkaPalay() {
  document.querySelector("#popup-star").textContent = currentTeacher.favorite
    ? "★"
    : "☆";
}

function toggleFavorite() {
  currentTeacher.favorite = !currentTeacher.favorite;
  zyrochkaPalay();
  renderFavorites();
  applyFilters();
}

function renderFavorites() {
  const favorites = USERS.filter((teacher) => teacher.favorite);
  const maxStart = Math.max(0, favorites.length - FAVORITES_VISIBLE);
  favoritesStart = Math.min(favoritesStart, maxStart);

  favoritesList.innerHTML = favorites
    .slice(favoritesStart, favoritesStart + FAVORITES_VISIBLE)
    .map((teacher) => cardHtml(teacher))
    .join("");

  const needsArrows = favorites.length > FAVORITES_VISIBLE;
  prevArrow.hidden = !needsArrows;
  nextArrow.hidden = !needsArrows;
  prevArrow.disabled = favoritesStart === 0;
  nextArrow.disabled = favoritesStart === maxStart;
}

function moveFavorites(step) {
  favoritesStart = Math.max(0, favoritesStart + step);
  renderFavorites();
}

//STATS TABLE

function pageNumbers(current, total) {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 2) {
    pages.add(2);
    pages.add(3);
  }
  const list = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const result = [];
  list.forEach((p, i) => {
    if (i > 0 && p - list[i - 1] > 1) result.push("...");
    result.push(p);
  });
  return result;
}

function renderStats() {
  const sorted = sortField
    ? sortUsers(currentList, sortField, sortOrder)
    : currentList;
  const start = (statsPage - 1) * STATS_PAGE_SIZE;

  statsBody.innerHTML = sorted
    .slice(start, start + STATS_PAGE_SIZE)
    .map(
      (teacher) => `
        <tr>
          <td>${teacher.full_name}</td>
          <td>${teacher.course ?? ""}</td>
          <td>${teacher.age ?? ""}</td>
          <td>${capitalize(teacher.gender) ?? ""}</td>
          <td>${teacher.country ?? ""}</td>
        </tr>`,
    )
    .join("");

  statsHead.querySelectorAll("th").forEach((th) => {
    th.classList.toggle(
      "sort-asc",
      th.dataset.field === sortField && sortOrder === 1,
    );
    th.classList.toggle(
      "sort-desc",
      th.dataset.field === sortField && sortOrder === -1,
    );
  });

  const pages = Math.ceil(sorted.length / STATS_PAGE_SIZE);
  statsPagination.innerHTML = pageNumbers(statsPage, pages)
    .map((p) =>
      p === "..."
        ? `<span class="page-dots">...</span>`
        : `<a href="#" class="page-link ${p === statsPage ? "active" : ""}" data-page="${p}">${p}</a>`,
    )
    .join("");
}

function sortStatsBy(field) {
  if (sortField === field) {
    sortOrder = -sortOrder;
  } else {
    sortField = field;
    sortOrder = 1;
  }
  statsPage = 1;
  renderStats();
}

function goToStatsPage(page) {
  statsPage = page;
  renderStats();
}

//ADD TEACHER FORM

function readNewTeacher() {
  const dob = document.querySelector("#teacher-dob").value;
  const sex = addForm.querySelector('input[name="sex"]:checked');

  return {
    id: `teach-${Date.now()}`,
    gender: sex ? sex.value : null,
    title: null,
    full_name: document.querySelector("#teacher-name").value.trim(),
    city: document.querySelector("#teacher-city").value.trim(),
    state: null,
    country: teacherCountry.value,
    postcode: null,
    coordinates: null,
    timezone: null,
    email: document.querySelector("#teacher-email").value.trim(),
    b_date: dob || null,
    age: dob ? new Date().getFullYear() - new Date(dob).getFullYear() : null,
    phone: document.querySelector("#teacher-phone").value.trim(),
    picture_large: null,
    picture_thumbnail: null,
    favorite: null,
    course: teacherCourse.value,
    bg_color: document.querySelector("#teacher-bg-color").value,
    note: document.querySelector("#teacher-notes").value.trim(),
  };
}

async function addTeacher() {
  const teacher = readNewTeacher();

  if (!teacher.course || !validateUser(teacher)) {
    addError.hidden = false;
    return;
  }

  addError.hidden = true;
  try {
    await postTeacher(teacher);
  } catch (error) {
    console.error(error);
  }

  USERS.unshift(teacher);
  applyFilters();
  addForm.reset();
  addModal.classList.remove("open");
}

//EVENTS

function handleClick(event) {
  const target = event.target;

  const card = target.closest(".teacher-card");
  if (card) {
    event.preventDefault();
    openPopup(card.dataset.id);
    return;
  }

  const closeButton = target.closest(".popup-close");
  if (closeButton) {
    event.preventDefault();
    closeButton.closest(".popup-overlay").classList.remove("open");
    return;
  }

  if (target.closest(".nav-add")) {
    event.preventDefault();
    addModal.classList.add("open");
    return;
  }

  if (target.closest("#popup-star")) {
    toggleFavorite();
    return;
  }

  if (target.closest(".show-more-btn")) {
    showMore();
    return;
  }

  if (target.closest(".carousel-arrow-prev")) {
    moveFavorites(-1);
    return;
  }

  if (target.closest(".carousel-arrow-next")) {
    moveFavorites(1);
    return;
  }

  const th = target.closest("th[data-field]");
  if (th) {
    sortStatsBy(th.dataset.field);
    return;
  }

  const pageLink = target.closest(".page-link");
  if (pageLink) {
    event.preventDefault();
    goToStatsPage(Number(pageLink.dataset.page));
  }
}

function handleChange(event) {
  if (event.target.closest(".filters")) {
    refreshTeachers();
  }
}

function handleSubmit(event) {
  event.preventDefault();

  if (event.target === searchForm) {
    refreshTeachers();
  } else if (event.target === addForm) {
    addTeacher();
  }
}

//INIT
async function init() {
  try {
    USERS.push(...(await loadValidUsers(LOAD_SIZE)));
  } catch (error) {
    console.error(error);
    grid.innerHTML = "<p>Could not load teachers</p>";
    return;
  }

  renderCountries();
  applyFilters();
  renderFavorites();
}

teacherCourse.innerHTML = optionsHtml(courses);
document.addEventListener("click", handleClick);
document.addEventListener("change", handleChange);
document.addEventListener("submit", handleSubmit);

init();
