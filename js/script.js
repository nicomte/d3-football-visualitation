function toggleCompetitions() {
    const competitionsList = document.getElementById("competitionsList");
    const toggleArrow = document.getElementById("toggleArrow");

    if (competitionsList.style.display === "none") {
        competitionsList.style.display = "block";
        toggleArrow.innerHTML = "&#x25B2;"; // Change arrow to "up"
    } else {
        competitionsList.style.display = "none";
        toggleArrow.innerHTML = "&#x25BC;"; // Change arrow to "down"
    }
}