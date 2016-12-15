var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var passport = require('passport');
var User = mongoose.model('User');
var jwt = require('express-jwt');
var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

router.param('post', function(req, res, next, id) {
  var query = Post.findById(id);

  query.exec(function (err, post){
    if (err) { return next(err); }
    if (!post) { return next(new Error('can\'t find post')); }

    req.post = post;
    return next();
  });
});

router.param('comment', function(req, res, next, id) {
  var query = Comment.findById(id);

  query.exec(function (err, comment){
    if (err) { return next(err); }
    if (!comment) { return next(new Error("can't find comment")); }

    req.comment = comment;
    return next();
  });
});

router.get('/posts', function(req, res, next) {
  Post.find(function(err, posts){
    if(err){ return next(err); }

    res.json(posts);
  });
});

router.post('/posts', auth, function(req, res, next) {
  var post = new Post(req.body);
  post.author = req.payload.username;

  if(!post.title || !post.link){
    return res.status(400).json({message: 'Please fill out the name and url before posting'});
  }

  post.save(function(err, post){
    if(err){ return next(err); }

    res.json(post);
  });
});

router.get('/posts/:post', function(req, res, next) {
  req.post.populate('comments', function(err, post) {
    if (err) { return next(err); }

    res.json(post);
  });
});

router.get('/posts/:post', function(req, res) {
  res.json(req.post);
});

router.delete('/posts/:post', auth, function(req, res, next){
  if (req.post.author != req.payload.username){
    return res.status(500).json({message: 'You can only delete your own posts!'});
  }
   /**req.comment.remove({post, req.post}, function(err){
    if (err) { return return next(err);}
  });
  **/
  req.post.remove(function(err, post){
    if (err) { return next(err); }

    res.send("success");
  });
});

router.put('/posts/:post/upvote', auth, function(req, res, next) {
  if (req.post.author == req.payload.username){
    return res.status(500).json({message: 'You can not upvote your own post!'});
  }
  req.post.upvote(function(err, post){
    if (err) { return next(err); }

    res.json(post);
  });
});

router.put('/posts/:post/downvote', auth, function(req, res, next) {
  if (req.post.author == req.payload.username){
    return res.status(500).json({message: 'Why would you want to downvote your own post?'});
  }
  req.post.downvote(function(err, post){
    if (err) { return next(err); }

    res.json(post);
  });
});

router.post('/posts/:post/comments', auth, function(req, res, next) {
  var comment = new Comment(req.body);
  comment.post = req.post;
  comment.author = req.payload.username;

  if(!comment.body){
    return res.status(400).json({message: 'Please fill out your comment before posting'});
  }

    comment.save(function(err, comment){
      if(err){ return next(err); }

    req.post.comments.push(comment);
    req.post.save(function(err, post) {
      if(err){ return next(err); }

      res.json(comment);
    });
  });
});

router.delete('/posts/:post/comments/:comment', auth, function (req,res,next){
if (req.comment.author != req.payload.username){
    return res.status(500).json({message: 'You can only delete your own comments!'});
}
  req.post.comments.splice(req.post.comments.indexOf(req.comments), 1);
  req.post.save(function(err, post){
    if (err){return res.status(500).send(err); }
    req.comment.remove(function(err){
      if (err){return next(err);}
      res.send("success");
    });
  });
});


router.put('/posts/:post/comments/:comment/upvote', auth, function (req, res, next) {
  if (req.comment.author == req.payload.username){
    return res.status(500).json({message: 'You can not upvote your own comment!'});
  }
    req.comment.upvote(function (err, comment) {
              if (err) {
                return res.status(500).send(err);
              }
        res.json(comment);
    });
});

router.put('/posts/:post/comments/:comment/downvote', auth, function (req, res, next) {
  if (req.comment.author == req.payload.username){
    return res.status(500).json({message: 'Why would you want to downvote your own comment?'});
  }
    req.comment.downvote(function (err, comment) {
              if (err) {
                return res.status(500).send(err); }
        res.json(comment);
    });
});

router.post('/register', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  var user = new User();

  user.username = req.body.username;

  user.setPassword(req.body.password)

  user.save(function (err){
    if(err){
      if (err.name === 'MongoError' && err.code === 11000) {
                    //Duplicate username
                    return res.status(500).send({success: false, message: 'User already exists'});
                  }
                  return res.status(500).send(err);
                 }

    return res.json({token: user.generateJWT()})
  });
});

router.post('/login', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  passport.authenticate('local', function(err, user, info){
    if(err){ return next(err); }

    if(user){
      return res.json({token: user.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
