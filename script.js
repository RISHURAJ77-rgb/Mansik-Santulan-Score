const API_BASE_URL = "http://127.0.0.1:2200";

const form = document.getElementById("predictForm");
const submitBtn = document.getElementById("submitBtn");
const btnText = submitBtn.querySelector(".btn-text");
const btnSpinner = submitBtn.querySelector(".btn-spinner");
const errorBox = document.getElementById("errorBox");
const resultCard = document.getElementById("resultCard");
const resultScore = document.getElementById("resultScore");
const resultNote = document.getElementById("resultNote");
const resetBtn = document.getElementById("resetBtn");

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function clearError() {
  errorBox.textContent = "";
  errorBox.classList.add("hidden");
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  btnText.classList.toggle("hidden", isLoading);
  btnSpinner.classList.toggle("hidden", !isLoading);
}

function scoreNote(score) {
  if (score >= 8) return "Great! Your indicators suggest strong mental well-being.";
  if (score >= 5) return "Moderate score — small lifestyle tweaks could help.";
  return "This score suggests it may help to focus on rest, activity, and balance.";
}

function buildPayload(formData) {
  return {
    age: Number(formData.get("age")),
    gender: formData.get("gender"),
    country: formData.get("country").trim(),
    academic_level: formData.get("academic_level"),
    most_used_platform: formData.get("most_used_platform"),
    purpose_of_use: formData.get("purpose_of_use"),
    avg_daily_usage_hours: Number(formData.get("avg_daily_usage_hours")),
    daily_unlocks: Number(formData.get("daily_unlocks")),
    study_hours: Number(formData.get("study_hours")),
    physical_activity_hours: Number(formData.get("physical_activity_hours")),
    sleep_hours_per_night: Number(formData.get("sleep_hours_per_night")),
    stress_level: formData.get("stress_level"),
  };
}

function formatValidationErrors(detail) {
  if (!Array.isArray(detail)) return "Please check your inputs and try again.";
  return detail
    .map((err) => {
      const field = Array.isArray(err.loc) ? err.loc[err.loc.length - 1] : "field";
      return `${field}: ${err.msg}`;
    })
    .join(" | ");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();
  resultCard.classList.add("hidden");

  const formData = new FormData(form);
  const payload = buildPayload(formData);

  setLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let message = `Request failed (status ${response.status}).`;
      try {
        const errData = await response.json();
        if (response.status === 422 && errData.detail) {
          message = formatValidationErrors(errData.detail);
        } else if (errData.detail) {
          message = typeof errData.detail === "string" ? errData.detail : message;
        }
      } catch (_) {
        // response wasn't JSON, keep default message
      }
      throw new Error(message);
    }

    const data = await response.json();
    const score = data.predicted_mental_health_score;

    resultScore.textContent = typeof score === "number" ? score.toFixed(2) : score;
    resultNote.textContent = scoreNote(Number(score));
    resultCard.classList.remove("hidden");
    resultCard.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (err) {
    if (err instanceof TypeError) {
      showError(
        "Couldn't reach the server. Make sure the API is running at " +
          API_BASE_URL +
          " and that CORS is enabled."
      );
    } else {
      showError(err.message || "Something went wrong. Please try again.");
    }
  } finally {
    setLoading(false);
  }
});

resetBtn.addEventListener("click", () => {
  resultCard.classList.add("hidden");
  clearError();
  form.reset();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
});
