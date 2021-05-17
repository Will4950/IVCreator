socket.on('upload_image', (data) => {
    $('#' + data.image).removeClass('d-none');
    $('#' + data.image).attr('src', data.src);
    $('#' + data.image + '_spin').addClass('d-none');
});