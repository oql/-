var dbnotices, dbusers, dbdislikes, dbjoins, dbworks, dbowns;
var socket, async;

function setDBs(_dbnotices, _dbusers, _dbdislikes, _dbjoins, _dbworks, _dbowns) {
	dbnotices = _dbnotices;
	dbusers = _dbusers;
	dbdislikes = _dbdislikes;
	dbjoins = _dbjoins;
	dbworks = _dbworks;
	dbowns = _dbowns; 
}

function setSocketAndAsync(_socket, _async) {
	socket = _socket;
	async = _async;
}

function nameCheck(data) {
	console.log(data);
	if(data) {
		dbusers.searchByNickname(data, function(user, err) {
			if(err) console.error(err);
			else if(!user) { // 가능한 닉네임
				socket.emit('namechecked', true);
			} else { // 이미 존재하는 닉네임
				socket.emit('namechecked', false);
			}
		});
	} else socket.emit('namechecked', false);
}
function titleCheck(data) {
	console.log(data);
	if(data) {
		dbworks.searchByName(data, function(work, err) {
			if(err) console.error(err);
			else if(!work) { // 가능한 공작이름
				socket.emit('titlechecked', true);
			} else { // 이미 존재하는 공작이름
				socket.emit('titlechecked', false);
			}
		});
	} else socket.emit('titlechecked', false);
}

function updateDislike(data) {
	async.waterfall([
		function(callback) {
			async.parallel([
				function(callback) {
					dbdislikes.searchById(data.userId, data.workId, function(dislikes, err) {
						console.log("범인은 dislikes ################################################3".cyan);
						if(err) console.log(err);
						else{
							callback(null, dislikes);
						}
					});
				},
				function(callback) {
					dbjoins.searchById( data.userId, data.workId, function( result, err ){
						console.log("범인은 joins ################################################3".cyan);
						if(err) console.error(err);
						else{
							callback(null, result);
						}
					});
				}
			],
			function(err, result) {
				if(result[1] != null) {
					console.log("범인은 마지막에서 두번째 ################################################3".cyan);
					dbnotices.putNotice(data.userId, "이런반동노무자식");
				}
				callback(null, result[0]);
			});
		},
		function(dislikes, callback) {
			dbdislikes.toggleTuple(dislikes, data, function(){
				callback();
			});
		}
	]);
	
	// async.waterfall([
	// 	function(callback){
	// 		dbdislikes.searchById(data.userId, data.workId, function(dislikes, err) {
	// 			if(err) console.log(err);
	// 			else{
	// 				callback(null, dislikes);
	// 			}
	// 		});
	// 	},
	// 	function( dislikes, callback ){
	// 		dbdislikes.toggleTuple(dislikes, data, function(){
	// 			callback();
	// 		});
	// 	}
	// ],
	// function(err, result){
	// 	dbdislikes.searchUsersDislikes(data.userId, function(result){
	// 		socket.broadcast.emit('serverUpdate',result);
	// 		socket.emit('serverUpdate',result);
	// 	});
	// });
}
function updateJoin(data){
	async.waterfall([
		function(callback) {
			dbjoins.searchById(data.userId, data.workId, function(joins, err){
				if(err) console.log(err);
				else{
					callback(null, joins);
				}
			});
		},
		function(joins, callback) {
			dbjoins.toggleTuple(joins, data, function(){
				callback();
			});
		}
	],
	function(err, result) {
		dbjoins.searchUsersJoin(data.userId, function(result){
			socket.broadcast.emit('serverUpdate',result);
			socket.emit('serverUpdate',result);
		});
	});
}

function notifyNotice(data) {
	
}

module.exports = {
	setDBs: setDBs,
	setSocketAndAsync: setSocketAndAsync,
	nameCheck: nameCheck,
	titleCheck: titleCheck,
	updateDislike: updateDislike,
	updateJoin: updateJoin
}