module.exports = function(router , controller){

		router.get('/', controller.homeController.index );

		router.get('/home',function(rep , res , next){
			res.send('Hello world');
		});


	return router;
}