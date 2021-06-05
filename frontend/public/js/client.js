const socket = io();

const createJob = (button) => {
    $('#status').html('');
    socket.emit('create_job', {
        sub: button.getAttribute('sub'),
        template: button.getAttribute('template')
    });
}

socket.on('create_job', () => {
    window.location.href = '/jobs'
});

const upload_text = (input) => {
    $('#' + input.getAttribute('id')).addClass('d-none');
    $('#' + input.getAttribute('id') + '_spin').removeClass('d-none');

    socket.emit('upload_text', {
        value: input.value,
        text: input.getAttribute('id'),
        sub: input.getAttribute('sub')
    });
}

socket.on('upload_text', (data) => {
    $('#' + data.text).removeClass('d-none');
    $('#' + data.text + '_spin').addClass('d-none');
});

const upload_image = (input) => {
    $('#' + input.getAttribute('iid')).addClass('d-none');
    $('#' + input.getAttribute('iid') + '_spin').removeClass('d-none');

    if (input.files && input.files[0]) { 
        var stream = ss.createStream();
        var blobstream = ss.createBlobReadStream(input.files[0]);
        ss(socket).emit('upload_image', stream, {                    
            sub: input.getAttribute('sub'),
            image: input.getAttribute('iid')
        });
        blobstream.pipe(stream);
    }
}

socket.on('upload_image', (data) => {
    $('#' + data.image).removeClass('d-none');
    $('#' + data.image).attr('src', data.src);
    $('#' + data.image + '_spin').addClass('d-none');
});

const refreshStatus = () => {
    $.ajax({url: '/status?page=' + $(location).attr('pathname').replace('/',''), type: 'get',
        success: (data) => {
            $('#status').html(data);
        }
    });
}

const refreshJobs = () => {
    $.ajax({url: '/status?page=' + $(location).attr('pathname').replace('/',''), type: 'get',
        success: (data) => {
            $('#job-card').html(data);
            $('#jobcard').removeClass('d-none');
            $('#jobspinner').addClass('d-none');
        }
    });
}

$(()=>{
    if ($(location).attr('pathname').replace('/','') === 'jobs'){
        refreshJobs();
        setInterval(refreshJobs, 10000);
    }
    setInterval(refreshStatus, 30000);
});
