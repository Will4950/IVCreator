const logger = require('src/logger');
const Datastore = require('nedb');
const db = new Datastore({ filename: 'db/frontend.db', autoload: true });

db.persistence.setAutocompactionInterval(60000);
db.on('compaction.done', () =>{
    logger.debug('nedb: compaction.done');
});

module.exports = db;