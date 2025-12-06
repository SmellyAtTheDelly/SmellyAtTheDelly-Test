// Authentication logic for login page

const API_URL = window.location.origin;

// Check if already logged in
if (localStorage.getItem('token')) {
  window.location.href = '/dashboard.html';
}

const loginForm = document.getElementById('login-form');
const errorContainer = document.getElementById('error-container');
const loginBtn = document.getElementById('login-btn');
const loginText = document.getElementById('login-text');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  // Clear previous errors
  errorContainer.innerHTML = '';

  // Show loading state
  loginBtn.disabled = true;
  loginText.innerHTML = '<span class="loading"></span>';

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Store token and user data
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    // Redirect to dashboard
    window.location.href = '/dashboard.html';

  } catch (error) {
    // Show error
    errorContainer.innerHTML = `
      <div class="error-message">
        ${error.message}
      </div>
    `;

    // Reset button
    loginBtn.disabled = false;
    loginText.textContent = 'Sign In';
  }
});
