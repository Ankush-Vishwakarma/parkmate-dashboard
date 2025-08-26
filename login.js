

document.getElementById('loginForm').addEventListener('submit', async function(event) {

    event.preventDefault(); 

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageElement = document.getElementById('message');
    const loginButton = document.getElementById('loginButton');

    showFullScreenLoader();

    try {
        const loginUrl = "https://dashboard.asaelectra.in:9000/api/login/";

        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: username, password: password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            localStorage.setItem('user_data', JSON.stringify(data.user));

            messageElement.textContent = 'Login successful! Redirecting...';
            messageElement.className = 'message-text success';

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            const errorMessage = data.detail || "Login failed. Please check your credentials again.";
            throw new Error(errorMessage);
        }
    } catch (error) {
        messageElement.textContent = `Error: ${error.message}`;
        messageElement.className = 'message-text error';
        console.error("Login Error:", error);
    } finally {
        
        hideFullScreenLoader();
        loginButton.disabled = false;
    }
});



// -----------------------------------Loader --------------------------------------------


const showFullScreenLoader = () => {
    let loader = document.getElementById("full-screen-loader");
    if (loader) {
        loader.style.display = "flex";
        return;
    }

    loader = document.createElement("div");
    loader.id = "full-screen-loader";
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(7, 7, 7, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        flex-direction: column;
    `;

    loader.innerHTML = `
        <div class="loader-content" style="
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        ">
            <svg
                width="50"
                height="50"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="conic-gradient" gradientTransform="rotate(90)">
                        <stop offset="20%" stop-color="#00A89F" />
                        <stop offset="30%" stop-color="#01A199" />
                        <stop offset="100%" stop-color="#1D2433" />
                    </linearGradient>
                </defs>
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="url(#conic-gradient)"
                    stroke-width="10"
                    stroke-dasharray="283"
                    stroke-dashoffset="0"
                    stroke-linecap="round"
                    fill="none"
                />
                <animateTransform
                    from="0 0 0"
                    to="360 0 0"
                    attributeName="transform"
                    type="rotate"
                    repeatCount="indefinite"
                    dur="1300ms"
                />
            </svg>
            <p style="
                font-family: 'Noto Sans', sans-serif;
                font-size: 22px;
                font-style: italic;
                color: white;
                font-weight: 300;
                margin-top: 16px;
            ">Loading...</p>
        </div>
    `;

    document.body.appendChild(loader);
};

// यह फ़ंक्शन फुल-स्क्रीन लोडर को छिपाता है।
const hideFullScreenLoader = () => {
    const loader = document.getElementById("full-screen-loader");
    if (loader) {
        loader.style.display = "none";
    }
};

// ============================= Loader Functions End ================================
