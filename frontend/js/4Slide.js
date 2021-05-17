$(()=>{
    setInterval(refreshStatus, 30000);
});

socket.on('upload_text', (data) => {
    $('#' + data.text).removeClass('d-none');
    $('#' + data.text + '_spin').addClass('d-none');
});

socket.on('upload_image', (data) => {
    $('#' + data.image).removeClass('d-none');
    $('#' + data.image).attr('src', data.src);
    $('#' + data.image + '_spin').addClass('d-none');
});

const refreshStatus = () => {
    $.ajax({url: '/api/4Slide', type: 'get'})
    .done((data) => {
        $('#status').html(data);
    });
}