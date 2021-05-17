$(()=>{
    refreshJobs();
    setInterval(refreshJobs, 10000);
});

const refreshJobs = () => {
    $.ajax({url: '/api/jobs', type: 'get'})
    .done((data) => {
        $('#job-card').html(data);
        $('#jobcard').removeClass('d-none');
        $('#jobspinner').addClass('d-none');
    });
}