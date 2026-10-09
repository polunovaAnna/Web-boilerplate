import { randomUserMock, additionalUsers } from "./FE4U-Lab2-mock.js";

const courses = ["Mathematics", "Physics", "English", "Computer Science", "Dancing", "Chess",
    "Biology", "Chemistry", "Law", "Art", "Medicine", "Statistics"]

function formatMockUsers(user) {
    const result = {
        gender: user.gender,
        title: user.title ?? user.name?.title,
        full_name: user.full_name || `${user.name?.first} ${user.name?.last}`,
        city: user.city ?? user.location?.city,
        state: user.state ?? user.location?.state,
        country: user.country ?? user.location?.country,
        postcode: user.postcode ?? user.location?.postcode,
        coordinates: user.coordinates ?? user.location?.coordinates,
        timezone: user.timezone ?? user.location?.timezone,
        email: user.email,
        b_date: user.b_day ?? user.dob?.date,
        age: user.dob?.age ?? (user.b_day ? new Date().getFullYear() - new Date(user.b_day).getFullYear() : null),
        phone: user.phone,
        picture_large: user.picture_large ?? user.picture?.large,
        picture_thumbnail: user.picture_thumbnail ?? user.picture?.thumbnail,
        id: typeof user.id === "string" ? user.id : null,
        favorite: user.favorite,
        course: user.course ?? courses[Math.floor(Math.random() * courses.length)],
        bg_color: user.bg_color,
        note: user.note ?? ""   
    };

    return Object.fromEntries(
        Object.entries(result).map(([key, value]) => [key, value ?? null])
    );
}

//TASK 1
export function getFormattedUsers(usersList = [...additionalUsers, ...randomUserMock]) {
    const formattedUsers = usersList.map(formatMockUsers);
    const knownUsers = new Set();
    
    return formattedUsers.filter(user => {
        const key = user.full_name ? user.full_name.trim().toLowerCase() : "";
        if (!key || knownUsers.has(key)) {
            return false;
        }
        knownUsers.add(key);
        return true;
    })
}

//TASK 2
export function validateUser(user) {
    const strings = ["full_name", "gender", "note", "state", "city", "country"];

    for (const name of strings) {
        const value = user[name];
        if (typeof value !== "string" || value.charAt(0) !== value.charAt(0).toUpperCase()) {
            return false;
        }
    }

    if (typeof user.age !== "number" || isNaN(user.age)) {
        return false;
    }

    if (!isValidPhone(user.phone)) return false;

    if (typeof user.email !== "string" || !user.email.includes('@')) {
        return false;
    }
    return true;
}

function isValidPhone(phone) {
    return typeof phone === "string"
        && /^[\d\s\-()+]+$/.test(phone)
        && phone.replace(/\D/g, "").length >= 8;
}

//TASK 3
export function filterUsers(users, values) {
    return users.filter(user =>
        Object.entries(values).every(([key, value]) => user[key] === value)
    );
}

//TASK 4
export function sortUsers(users, field, order = 1) {
    const way = order === 1 ? 1 : -1;
    return [...users].sort((a, b) => {
        const x = a[field];
        const y = b[field];

        if (x == null && y == null) {
            return 0;
        }
        if (x == null) {
            return 1;
        }
        if (y == null) {
            return -1;
        }

        if (typeof x === "number") {
            return (x - y) * way;
        }
        return x.localeCompare(y) * way;
    });
}

//TASK 5
export function findUser(users, field, value) {
    return users.find(user => {
        const x = user[field];
        if (typeof x === "number") {
            return x === value;
        }
        if (typeof x === "string") {
            return x.toLocaleLowerCase().includes(String(value).toLowerCase());
        }
        return false;
    });
}

//TASK 6
export function countPercentage(users, condition) {
    if (users.length === 0) {
        return 0;
    }
    const match = users.filter(condition).length;
    return Math.round((match / users.length) * 100 * 100) / 100;
}

