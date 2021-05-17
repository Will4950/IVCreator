$(()=>{
    setInterval(refreshStatus, 30000);
});

socket.on('upload_image', (data) => {
    $('#' + data.image).removeClass('d-none');
    $('#' + data.image).attr('src', data.src);
    $('#' + data.image + '_spin').addClass('d-none');
});

const refreshStatus = () => {
    $.ajax({url: '/api/Welcome', type: 'get'})
    .done((data) => {
        $('#status').html(data);
    });
}