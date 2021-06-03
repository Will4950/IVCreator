const upload_text = (input) => {
    $('#' + input.getAttribute('id')).addClass('d-none');
    $('#' + input.getAttribute('id') + '_spin').removeClass('d-none');

    var form = new FormData();
    form.append('sub', input.getAttribute('sub'));
    form.append('text', input.getAttribute('id'));
    form.append('value', input.value);

    $.ajax({url: '/upload-text', type: 'post', enctype: 'multipart/form-data', processData: false, contentType: false, cache: false, data: form})
    .done((data) => {
        $('#' + data.text).removeClass('d-none');
        $('#' + data.text + '_spin').addClass('d-none');
    });
}

const upload_image = (input) => {
    $('#' + input.getAttribute('iid')).addClass('d-none');
    $('#' + input.getAttribute('iid') + '_spin').removeClass('d-none');

    var form = new FormData();
    form.append('file', input.files[0]);
    form.append('sub', input.getAttribute('sub'));
    form.append('image', input.getAttribute('iid'));

    $.ajax({url: '/upload-image', type: 'post', enctype: 'multipart/form-data', processData: false, contentType: false, cache: false, data: form})
    .done((data) => {
        $('#' + data.image).removeClass('d-none');
        $('#' + data.image).attr('src', data.src);
        $('#' + data.image + '_spin').addClass('d-none');
    });
}

const createJob = (button) => {
    $('#status').html('');
    
    var form = new FormData();
    form.append('template', button.getAttribute('template'));
    form.append('sub', button.getAttribute('sub'));

    $.ajax({url: '/create-job', type: 'post', enctype: 'multipart/form-data', processData: false, contentType: false, cache: false, data: form})
    .done(() => {        
        window.location.href = '/jobs'
    });
}

const refreshStatus = () => {
    $.ajax({url: '/status?page=' + $(location).attr('pathname').replace('/',''), type: 'get'})
    .done((data) => {
        $('#status').html(data);
    });
}

const refreshJobs = () => {
    $.ajax({url: '/status?page=' + $(location).attr('pathname').replace('/',''), type: 'get'})
    .done((data) => {
        $('#job-card').html(data);
        $('#jobcard').removeClass('d-none');
        $('#jobspinner').addClass('d-none');
    });
}

$(()=>{
    if ($(location).attr('pathname').replace('/','') === 'jobs'){
        setTimeout(refreshJobs, 250);
        setInterval(refreshJobs, 10000);
    }
    setInterval(refreshStatus, 30000);
});
