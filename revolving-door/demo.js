$(function(){

	$(document).ready(function(){
		var doors = new Array();
		for (var i = 0; i < 8;i++) {
			var bgName = "background"+(i+1)+".jpg";
			var door = $("<div id='door_"+i+"'></div>");
			door.css({"background":"url('"+bgName+"') no-repeat center","background-size":"300px","width":"300px","height":"160px"});
			doors.push(door);
		}
		$("#tester").RevolveDoor(doors,{perspective_origin_y:"-200px"});
	});
});