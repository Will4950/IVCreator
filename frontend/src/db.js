const logger = require('src/logger');
const Datastore = require('nedb');
const db = new Datastore({ filename: 'db/frontend.db', autoload: true });
const jobs_db = new Datastore({ filename: 'db/frontend-jobs.db', autoload: true });

db.persistence.setAutocompactionInterval(300000);
db.on('compaction.done', () =>{
    logger.silly('db: compaction.done');
});

jobs_db.persistence.setAutocompactionInterval(60000);
jobs_db.on('compaction.done', () =>{
    logger.silly('jobs_db: compaction.done');
});

module.exports = {db, jobs_db};