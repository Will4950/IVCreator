const socket = io();
var reader = new FileReader();

const image4Slide = (input) => {
    var dvimage = $('#slide' + parseInt(input.getAttribute('sid').match(/\d+$/)[0], 10));
    var dvspin = $('#slide' + parseInt(input.getAttribute('sid').match(/\d+$/)[0], 10) + 'spin');
    dvspin.removeClass('d-none');
    dvimage.addClass('d-none');    

    if (input.files && input.files[0]) {        
        var stream = ss.createStream();
        var blobstream = ss.createBlobReadStream(input.files[0])                
        ss(socket).emit('ss-update-file_4Slide', stream, {                    
            sub: sub,
            image: 'file_4Slide_' + parseInt(input.getAttribute('sid').match(/\d+$/)[0], 10),
        });
        blobstream.pipe(stream);
    }
};

const text4Slide = (input) => {
    socket.emit('update-text_4Slide', {
        sub: sub,
        text: input.getAttribute('id'),
        value: input.value
    });
};

const createJob = (page) => {
    socket.emit('createJob', {
        sub: sub,
        page: page
    });
};

const getJobs = (page) => {
    socket.emit('getJobs', {
        sub: sub,
        page: page
    });
};

socket.on('image', (data) => {
    var dvimage = $('#slide' + parseInt(data.img.match(/\d+$/)[0], 10));
    var dvspin = $('#slide' + parseInt(data.img.match(/\d+$/)[0], 10) + 'spin');
    dvimage.removeClass('d-none');
    dvspin.addClass('d-none');
    dvimage.attr('src', data.src);
})

socket.on('jobs', (data) => {
    switch(data.page){
        case 'jobs':
            var dvheader = $('#jobheader');
            var dvjobstatus = $('#jobstatus');
            var dvjobid = $('#jobid');
            var dvprogress = $('#progress');
            var dvprogval = $('#progval');
            var dvdownload = $('#download');    

            dvprogress.removeClass('bg-warning');
            dvprogress.addClass('bg-success');
            dvheader.html(data.qjobs + ' jobs in queue');            
            if(!data.cjob[0]){
                dvprogval.html('');
                dvprogress.attr('style', 'width: 100%;');
                dvprogress.removeClass('bg-success');
                dvprogress.addClass('bg-warning');
            } else {
                dvjobstatus.html('Job status: ' + data.cjob[0].state);
                dvjobid.html('job id: ' + data.cjob[0].uid)
                if (data.cjob[0].renderProgress){
                    dvprogval.html(data.cjob[0].renderProgress + '%');
                    dvprogress.attr('style', 'width: ' + data.cjob[0].renderProgress + '%;');
                }                                
                switch(data.cjob[0].state) {
                    case 'finished':
                        dvprogval.html('complete');
                        dvprogress.attr('style', 'width: 100%;');
                        dvdownload.attr('href', '/' + sub + '.mp4');
                        dvdownload.removeClass('d-none');
                        break;
                    case 'queued':
                        dvprogress.attr('style', 'width: 100%;');
                        dvprogress.removeClass('bg-success');
                        dvprogress.addClass('bg-warning');
                        break;
                    case 'render:dorender':
                        if (data.cjob[0].renderProgress == 100){
                            dvprogval.html('encoding');
                            dvprogress.attr('style', 'width: 100%;');
                            dvprogress.removeClass('bg-success');
                            dvprogress.addClass('bg-warning');
                        }
                        break;
                    default:
                        dvprogval.html('');
                        dvprogress.attr('style', 'width: 100%;');
                        dvprogress.addClass('bg-warning');                        
                }
            }
            break;
        default:
            var dvjobinfo = $('#jobinfo');
            var dvjobbuttons = $('#jobbuttons');
            if(!data.cjob[0]){
                dvjobinfo.html('If it looks good, click a button.');
                dvjobbuttons.removeClass('d-none');
            } else {
                switch(data.cjob[0].state) {
                    case 'error':
                    case 'finished':
                        dvjobinfo.html('To create a new render, click a button.');
                        dvjobbuttons.removeClass('d-none');
                        break;
                    default:
                        dvjobinfo.html('You have a job in the queue.  Only 1 job is allowed at a time.');
                }
            }
    }       
});

