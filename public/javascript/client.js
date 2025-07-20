const form = document.getElementById("form");

form.addEventListener("submit", () =>
 {
  

  const farmername = document.getElementById("farmername").value.trim();
  const phonenumber = document.getElementById("phonenumber").value.trim();
  const password = document.getElementById("password").value.trim();
  const land = document.getElementById("land").value.trim();
  const income = document.getElementById("income").value.trim();
  const investment = document.getElementById("investment").value.trim();
   
  if (validate()) 
    {
      fetch("http://localhost:3000/register", 
        {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        farmername,
        phonenumber,
        password,
        land,
        income,
        investment,
      })
      })
    }
    
      
});

function validate() {
  const farmername = document.getElementById("farmername").value.trim();
  const phonenumber = document.getElementById("phonenumber").value.trim();
  const password = document.getElementById("password").value.trim();
  const land = document.getElementById("land").value.trim();
  const income = document.getElementById("income").value.trim();
  const investment = document.getElementById("investment").value.trim();

  let isValid = true;

  // Farmer Name
  if (farmername === "") {
    showError("farmername_error", "Farmer name is required");
    isValid = false;
  } else {
    hideError("farmername_error");
  }

  // Phone Number
  const phonepattern = /^\+?[0-9\s-]{10,20}$/;
  if (phonenumber === "" || !phonepattern.test(phonenumber)) {
    showError("phonenumber_error", "Enter a valid phone number");
    isValid = false;
  } else {
    hideError("phonenumber_error");
  }

  // Password
  if (password === "") {
    showError("password_error", "Password is required");
    isValid = false;
  } else {
    hideError("password_error");
  }

  // Land
  if (land === "" || isNaN(land) || Number(land) <= 0) {
    showError("land_error", "Enter valid land area ");
    isValid = false;
  } else {
    hideError("land_error");
  }

  // Income
  if (income === "" || isNaN(income) || Number(income) <= 0) {
    showError("income_error", "Enter valid income ");
    isValid = false;
  } else {
    hideError("income_error");
  }

  // Investment
  if (investment === "" || isNaN(investment) || Number(investment) <= 0) {
    showError("investment_error", "Enter valid investment ");
    isValid = false;
  } else {
    hideError("investment_error");
  }

  return isValid;
}

function showError(id, message) {
  const el = document.getElementById(id);
  el.textContent = message;
  el.style.display = "block";
}

function hideError(id) {
  const el = document.getElementById(id);
  el.style.display = "none";
}