const socket = io();
const reader = new FileReader();

const upload_text = (input) => {
    $('#' + input.getAttribute('id')).addClass('d-none');
    $('#' + input.getAttribute('id') + '_spin').removeClass('d-none');
    socket.emit('upload_text', {
        value: input.value,
        text: input.getAttribute('id'),
        sub: input.getAttribute('sub')
    });
}

const upload_image = (input) => {
    $('#' + input.getAttribute('iid')).addClass('d-none');
    $('#' + input.getAttribute('iid') + '_spin').removeClass('d-none');
    if (input.files && input.files[0]) { 
        var stream = ss.createStream();
        var blobstream = ss.createBlobReadStream(input.files[0])
        ss(socket).emit('upload_image', stream, {                    
            sub: input.getAttribute('sub'),
            image: input.getAttribute('iid')
        });
        blobstream.pipe(stream);
    }
}

const createJob = (button) => {
    socket.emit('createJob', {
        sub: button.getAttribute('sub'),
        template: button.getAttribute('template')
    });
    $('#status').html('');
    window.location.href = '/jobs'
}

