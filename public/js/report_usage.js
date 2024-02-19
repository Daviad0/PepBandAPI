function refreshFilter(){
    let start = document.getElementById("report-filter-start").value;
    let end = document.getElementById("report-filter-end").value;

    window.location = `/report/songs?start=${start}&end=${end}`;
}