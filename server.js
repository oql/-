var express = require("express");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser")
var session = require('express-session');
var app = express();
app.use(cookieParser());
app.use(session({
	secret: "secret"
}));
require('colors');

set = require('./setting.json');
require('./database.js')(this);

app.set("view engine", "ejs");
app.set("views", __dirname+"/app/views");
app.use( express.static( __dirname + "/public" ));
app.use(bodyParser.urlencoded({ extended: false }));


var path = require('path');
var async = require('async');

var FB = require('facebook-node');
var passport = require('passport')
    , FacebookStrategy = require('passport-facebook').Strategy;
	app.use(passport.initialize());
	app.use(passport.session());
	
// serialize
// 인증후 사용자 정보를 세션에 저장
passport.serializeUser(function(user, done) {
    console.log('serialize', user);
    done(null, user);
});
// deserialize
// 인증후, 사용자 정보를 세션에서 읽어서 request.user에 저장
passport.deserializeUser(function(user, done) {
    //findById(id, function (err, user) {
    console.log('deserialize', user);
    done(null, user);
    //});
});
passport.use(new FacebookStrategy({
        clientID: '1610016475924040',
        clientSecret: set.fb.secret,
        callbackURL: "http://localhost:3000/auth/fb/callback"
    },
    function(accessToken, refreshToken, profile, done) {
		console.log("P",profile)
		//console.log(user);
		Users.findOne({
			fbId: profile.id
		}).then(function(user, err) {
			console.log("USER?".red, user)
			if(err) {
				
			} else if(!user) { // 해당 액세스토큰을 가진 유저가 DB에 없음
				console.log("no user")
				Users.create({
					fbId: profile.id,
					fbToken: accessToken,
					name: profile.displayName,
					picture: 'https://graph.facebook.com/v2.4/'+profile.id+'/picture'
				}).then(function(user, err) {
					console.log(user);
					return done(null, user);
				});
			} else {
				console.log("user is")
				return done(null, user);
			}
		});
    }
));
app.get('/auth/fb', passport.authenticate('facebook'));
app.get('/auth/fb/callback',
    passport.authenticate('facebook', {
		successRedirect: '/join',
        failureRedirect: '/loginFail'
	})
);
app.get('/loginSuccess', ensureAuthenticated, function(req, res){
	console.log("로그인성공");
    res.send(req.user);
});
app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});
function ensureAuthenticated(req, res, next) {
	console.log("auth check");
    // 로그인이 되어 있으면, 다음 파이프라인으로 진행
    if (req.isAuthenticated()) { return next(); }
    // 로그인이 안되어 있으면, login 페이지로 진행
	else {
		console.log("not logged");
		res.redirect('/');
	}
}
app.route("/")
	.get(function(req, res){
        Works.findAll().then(function(works, err) {
            if(err) console.error(err);
            else {
				//console.log(works);
                res.render("frontpage.ejs", {works: works});
            }
        });
	});
app.get('/join', ensureAuthenticated, function(req, res) {
	Users.findOne({
		where: {
			fbId: req.user.fbId
		}
	}).then(function(user) {
		if(!user.nickname) {
			res.render('join.ejs', {
				name: req.user.name,
				picture: req.user.picture
			});
		} else {
			res.redirect('/'); //닉네임 이미 등록됨.
		}
	})
	
});
app.post('/join', ensureAuthenticated, function(req, res) {
	console.log(req.body);
	Users.findOne({ // 해당 닉네임 있는지 확인
		where: {
			nickname: req.body.nickname
		}
	}).then(function(user, err) {
		if(err) console.error(err);
		if(!user) { // 가능한 닉네임
			Users.findOne({
				fbId: req.user.fbId, // 현재 세션의 페이스북 uid로 찾는다
			}).then(function(user, err) {
				if(err) console.error(err);
				else if(!user){ // 그 세션의 uid에 해당하는 게 등록 안되어있음 (이상한 케이스)
					res.redirect('/');
				} else {
					user.updateAttributes({ // 찾은 유저정보에서 닉네임을 받은 닉네임으로 바꿔준다
						nickname: req.body.nickname
					}).then(function(user, err) {
						if(err) {
							console.error(err);
							res.status(500).end();
						}
						else {
							console.log("유저 생성 :".cyan, user.name);
							res.status(201).end();
						}
					});
				}
			});
		} else {
			// 이미 존재하는 닉네임
			res.status(409).end();
		}
	})
});

app.get('/work/:workId', function(req, res){
	var workId = req.params.workId;
	Works.findOne({
		where: {
			id: workId
		}
	}).then(function(work, err) {
		if(err) console.error(err);
		else {
			console.log("공작 조회 :".cyan, work.name);
			res.render("workpage.ejs", {work: work} );
		}
	});
	
})
app.post('/work', function(req, res){
	var workId = req.params.workId;
	Works.findOrCreate({
		where: {
			name: req.body.name,
			desc: req.body.desc
		}
	}).then(function(work, err) {
		if(err) console.error(err);
        else {
			console.log("공작 생성 :".cyan, work.name);
            res.redirect('/');
        }
	});
});

app.route(/\/user\/.*/)
	.get(function(req, res){
		var user_nickname = req.path.split("/").slice(-1)[0];
		connection.query("select * from users where Nickname='"+user_nickname+"' limit 1",function(err, rows){
			if (err) {
				console.error(err);
				throw err;
			}
			res.render( "userpage.ejs", {users: rows} );
		});
	})
	.post(function(req, res){
		// edit information
	});

app.listen(3000);
console.log("3000".cyan+"번 포트에서 서버 시작".green);
