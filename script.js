/// Import modular SDK
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, collection, getDocs, updateDoc } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';

// Firebase configuration & initialization
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);



let currentUser = null


// Navigation toggling
document.querySelectorAll('.nav-link').forEach((navElement) => {
    let text = navElement.innerHTML.toLowerCase();
    navElement.addEventListener('click', () => showPage(text));
});

function showPage(currentPage) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.toggle('hidden', page.id != currentPage);
    });
}


// Modal handling
const loginModal = document.getElementById("login-modal");
const signupModal = document.getElementById("signup-modal");
const editProfileModal = document.getElementById("edit-profile-modal");
const editProfileBtn = document.querySelector(".edit-profile");
const editProfileForm = document.getElementById("editProfileForm");
const loginBtn = document.getElementById("login");
const signupBtn = document.getElementById("sign-up");
const closeBtns = document.querySelectorAll(".close");

// Open Modals
loginBtn.addEventListener("click", () => loginModal.style.display = "block");
signupBtn.addEventListener("click", () => signupModal.style.display = "block");

// Close when clicking cross
closeBtns.forEach(btn => btn.addEventListener("click", () => {
    loginModal.style.display = "none";
    signupModal.style.display = "none";
}));


// Close when clicking outside modal content
window.addEventListener("click", (e) => {
    if (e.target === loginModal) loginModal.style.display = "none";
    if (e.target === signupModal) signupModal.style.display = "none";
    if (e.target === editProfileModal) editProfileModal.style.display = "none"; 
});

// Forms inside modals
const loginForm = loginModal.querySelector("form");
const signupForm = signupModal.querySelector("form");

// Login form submission
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = loginForm.querySelector('input[type="email"]').value;
    const password = loginForm.querySelector('input[type="password"]').value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            currentUser = { uid: user.uid, ...userDocSnap.data() };
            loginModal.style.display = "none";
            loginForm.reset();

            loginBtn.style.display = "none";
            signupBtn.style.display = "none";

            document.querySelector(".user-profile").style.display = "flex";

            document.querySelector('#nav-profile').classList.remove("hidden");
            updateUserInfo();
        } else {
            alert("User data not found in Firestore!");
        }

    } catch (error) {
        alert("Error: " + error.message);
    }
});

// Signup form submission
signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullname = signupForm.querySelector('input[name="fullname"]').value;
    const username = signupForm.querySelector('input[name="username"]').value;
    const email = signupForm.querySelector('input[name="email"]').value;
    const password = signupForm.querySelector('input[name="password"]').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, {
            fullname,
            username,
            email,
            createdAt: serverTimestamp(),
            photoURL: "",
            badges: null,
            recentActivity: null,
            easy: 0,
            medium: 0,
            hard: 0,
            contests: 0
        });

      

        // Fetch saved data
        currentUser = { uid: user.uid, fullname, username, email, photoURL: "", badges: null, recentActivity: null, easy: 0, medium: 0, hard: 0, contests: 0 };

        signupModal.style.display = "none";
        signupForm.reset();

        loginBtn.style.display = "none";
        signupBtn.style.display = "none";

        document.querySelector(".user-profile").style.display = "flex";

        document.querySelector('#nav-profile').classList.remove("hidden");
        updateUserInfo();

    } catch (error) {
        alert("Error: " + error.message);
    }
});


// Event listener to open and pre-fill the edit profile modal
editProfileBtn.addEventListener("click", () => {
    if (!currentUser) return; 

    editProfileForm.querySelector('input[name="fullname"]').value = currentUser.fullname;
    editProfileForm.querySelector('input[name="username"]').value = currentUser.username;
    editProfileForm.querySelector('input[name="photourl"]').value = currentUser.photoURL || "";

    editProfileModal.style.display = "block";
});

// Event listener for Edit Profile form submission
editProfileForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newFullname = editProfileForm.querySelector('input[name="fullname"]').value;
    const newUsername = editProfileForm.querySelector('input[name="username"]').value;
    const newPhotoURL = editProfileForm.querySelector('input[name="photourl"]').value;

    if (!currentUser) {
        alert("You must be logged in to do this.");
        return;
    }

    const userDocRef = doc(db, "users", currentUser.uid);

    try {
        // Update the document in Firestore
        await updateDoc(userDocRef, {
            fullname: newFullname,
            username: newUsername,
            photoURL: newPhotoURL
        });

        // Update the local currentUser object
        currentUser.fullname = newFullname;
        currentUser.username = newUsername;
        currentUser.photoURL = newPhotoURL;

        // Update the UI immediately
        updateUserInfo();

        // Close the modal
        editProfileModal.style.display = "none";
        alert("Profile updated successfully!");

    } catch (error) {
        console.error("Error updating profile:", error);
        alert("Error updating profile: " + error.message);
    }
});

// Logout
const logout = document.getElementById("logout-btn");
logout.addEventListener("click", (e) => {
    currentUser = null;
    window.location.reload();
});

function updateUserInfo() {
    if (!currentUser) return; 

    // Update avatars (navbar and profile page)
    document.querySelectorAll(".avatar-img").forEach((img) => {
        if (currentUser.photoURL && currentUser.photoURL !== "") {
            img.src = currentUser.photoURL;
        } else {
            img.src = "https://thumbs.dreamstime.com/b/default-avatar-profile-vector-user-profile-default-avatar-profile-vector-user-profile-profile-179376714.jpg";
        }
    });

    // Update names (navbar and profile page)
    document.querySelectorAll(".fullname").forEach((fullname) => {
        fullname.textContent = currentUser.fullname;
    });

    // Update profile page details
    const username = document.querySelector(".username");
    username.textContent = currentUser.username;

    const email = document.querySelector(".email");
    email.textContent = currentUser.email;

    // UPDATE THE STATS BOX
    document.getElementById("stats-easy").textContent = currentUser.easy || 0;
    document.getElementById("stats-medium").textContent = currentUser.medium || 0;
    document.getElementById("stats-hard").textContent = currentUser.hard || 0;
    document.getElementById("stats-contests").textContent = currentUser.contests || 0;
}


// Contests

let allContests = [];


const dropdown = document.querySelector("#contests-selector");
dropdown.addEventListener("change", () => {
    loadContests(dropdown.value.toLowerCase());
});

async function loadContests(currentContests) {
    const container = document.getElementById("contests-box");
    container.innerHTML = `<p style="text-align: center;">Loading contests...</p>`;

    try {
        const snapshot = await getDocs(collection(db, "contests"));
        const now = new Date();
        allContests = [];

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const start = data.startTime?.toDate();
            const end = data.endTime?.toDate();

            // Determine contest status
            let status = now < start ? "upcoming" :
                now >= start && now <= end ? "active" : "ended";

            allContests.push({
                id: docSnap.id,
                title: data.title,
                description: data.description || "",
                startTime: start,
                endTime: end,
                status
            });
        });

        // Sort contests: active → upcoming → ended, then by startTime
        const statusPriority = { "active": 1, "upcoming": 2, "ended": 3 };
        allContests.sort((a, b) => {
            if (statusPriority[a.status] !== statusPriority[b.status]) {
                return statusPriority[a.status] - statusPriority[b.status];
            } else {
                return a.startTime - b.startTime;
            }
        });

        // Filter 
        let visible = allContests;
        if (currentContests != "all") {
            visible = allContests.filter(c => c.status == currentContests);
        }

        if (visible.length === 0) {
            container.innerHTML = `<p style="text-align: center;">No Contests available. Check back later</p>`;
            return;
        }

        // Render contests
        container.innerHTML = visible.map(c => `
            <div class="contest-card ${c.status}">
                <div class="contest-card-info">
                    <h3>${c.title}</h3>
                    <p>${c.description}</p>
                    <p class="time-para">Start: ${c.startTime.toLocaleString('en-IN')}</p>
                    <p class="time-para">End: ${c.endTime.toLocaleString('en-IN')}</p>
                </div>
                <div class="contest-card-time">
                    <p>${c.status.toUpperCase()}</p>
                </div>
                
                
            </div>
        `).join("");

        // Render home page contests
        const homeContest = document.querySelector(".home-contest");
        homeContest.innerHTML = "No active Contest available."
        for (let c of allContests) {
            if (c.status == "active") {
                homeContest.innerHTML = `
            <div class="home-contest-card ${c.status}">
                <h3 style="padding: 10px 0">${c.title}</h3>
                <p>${c.description}</p>
                <p>Start: ${c.startTime.toLocaleString('en-IN')}</p>
                <p>End: ${c.endTime.toLocaleString('en-IN')}</p>
            </div>
        `;
                break;
            }
        }

    } catch (error) {
        console.error("Error loading contests:", error);
        container.innerHTML = `<p style="text-align: center;">Error loading contests: ${error.message}</p>`;
    }
}



document.addEventListener("DOMContentLoaded", () => {
    loadContests("all");
});
