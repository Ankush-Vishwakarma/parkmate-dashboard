document.getElementById('loginForm').addEventListener('submit', async function(event) {
    // This line is crucial. It stops the default form submission and page refresh.
    event.preventDefault(); 

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageElement = document.getElementById('message');
    const loginButton = document.getElementById('loginButton');

    // Show loading state
    messageElement.textContent = 'Logging in...';
    messageElement.className = 'message-text';
    loginButton.disabled = true;

    try {
        const loginUrl = "https://dashboard.asaelectra.in:9000/api/login/";

        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // The API expects 'email' as the key, not 'username'
            body: JSON.stringify({ email: username, password: password })
        });

        const data = await response.json();

        if (response.ok) {
            // Login successful
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            localStorage.setItem('user_data', JSON.stringify(data.user));

            messageElement.textContent = 'Login successful! Redirecting...';
            messageElement.className = 'message-text success';

            setTimeout(() => {
                // Redirect to the dashboard after a short delay
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            // Login failed due to API error (e.g., incorrect credentials)
            const errorMessage = data.detail || "Login failed. Please check your credentials again.";
            throw new Error(errorMessage);
        }
    } catch (error) {
        // Handle network or other errors
        messageElement.textContent = `Error: ${error.message}`;
        messageElement.className = 'message-text error';
        console.error("Login Error:", error);
    } finally {
        // Re-enable the login button
        loginButton.disabled = false;
    }
});