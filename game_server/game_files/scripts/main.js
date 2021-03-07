var room_list = document.getElementById("room_list");
var name_input = document.getElementById("name_input");
var room_input = document.getElementById("room_input");
var join_button = document.getElementById("join_button");

var room_join_form = document.getElementById("room_join_form");

var rooms_list_data = null;

var socket = io(SERVER_URL);
socket.on("room_list", onRoomList);

function getToken() 
{
    return Math.random().toString(36).substr(2);
};

room_join_form.onsubmit = function()
{
	var player_class = getPlayerClass();

	if (!player_class)
	{
		alertify.confirm().set({delay: 2000});
	    alertify.error("You should choose your hero");  
		return false;
	}

	var emoji_pack_name = getEmojiPackName(); 

	if (!emoji_pack_name)
	{
		alertify.confirm().set({delay: 2000});
	    alertify.error("You should choose your emoji pack");  
		return false;
	}

	var player_name = name_input.value.trim();	
	var room_name = room_input.value.trim();

	if (!checkName(player_name, room_name))
	{
	    alertify.error("Username is already taken in this room");  
		return false;
	}

	console.log("%s will join %s with class %s", player_name, room_name, player_class);

	// TODO: prepare queries
	var query = '?room_name=' + room_name;
	query +='&player_name=' + player_name;
	query += '&player_class=' + player_class;
	query += '&player_emoji_pack_name=' + emoji_pack_name; 
	query += '&token=' + getToken();
	window.location = GAME_PATH + query;

	function checkName(player_name, room_name)
	{
		if (!rooms_list_data)
		{
			return true;
		}

		if (Object.keys(rooms_list_data.room_player_names).indexOf(room_name) === -1)
		{	
			return true;
		}
		return !rooms_list_data.room_player_names[room_name].includes(player_name);
	}

	function getPlayerClass()
	{
		var player_class = null;

		if (document.getElementById("sqy_checkbox").checked)
		{
			player_class = 'sqy';
		}
		else if (document.getElementById("cii_checkbox").checked)
		{
			player_class = 'cii';
		}
		else if (document.getElementById("tri_checkbox").checked)
		{
			player_class = 'tri';
		}

		return player_class;
	}

	function getEmojiPackName()
	{
		var emoji_pack_name = null;

		if (document.getElementById("emoji_pack_checkbox").checked)
		{
			emoji_pack_name = 'emoji';
		}

		else if (document.getElementById("pepe_pack_checkbox").checked)
		{
			emoji_pack_name = 'pepe';
		}

		else if (document.getElementById("cat_pack_checkbox").checked)
		{
			emoji_pack_name = 'cat';
		}


		else if (document.getElementById("animals_pack_checkbox").checked)
		{
			emoji_pack_name = 'animals';
		}


		return emoji_pack_name
	}

	return false;
}

room_list.onclick = function(event) 
{
	event.stopPropagation();
    var room_name = getClickRoomItem(event);

    room_input.value = room_name;

    function getClickRoomItem(e) 
	{
		var content = event.composedPath()[2].innerHTML;
		var regexp = /<div class="room-title[^"]*?">(.*?)<\/div>/g;

		if (content.match(regexp).length > 1) return "";
    	return regexp.exec(content)[1]; 
	}
};

function onRoomList(data)
{
	rooms_list_data = data;

	// Empty room list
	while (room_list.firstChild) 
	{
  		room_list.removeChild(room_list.firstChild);
	}

	var room_names = Object.keys(rooms_list_data.room_player_names);
	room_names.forEach(function(room_name) 
	{
		var room_players = rooms_list_data.room_player_names[room_name];
		var room_item = document.createElement('li');
		// var room_title = room_name + " (" + room_players.length  + "/" + ROOM_CAPACITY + ")";
		var room_title = room_name;

		var width = (room_players.length / ROOM_CAPACITY) * 100;
		var room_item_content = "<div class='room-capacity'><div class='room-title'>" + room_title;
		room_item_content += "</div><div class='room-current-capacity' style='width: " + width + "%'></div></div>";

		room_item_content += "<div class='room-players'>";
		room_players.forEach(function(room_player_name)
		{
			room_item_content+= "<div class='room-player'>" + room_player_name + "</div>";
		}); 
		room_item_content += "</div>";

		room_item.innerHTML = room_item_content;

    	room_list.appendChild(room_item);
	});
}

socket.emit('get_room_list');

$("input:checkbox").on('click', function() 
{
  var $box = $(this);
  if ($box.is(":checked")) 
  {
    var group = "input:checkbox[name='" + $box.attr("name") + "']";
    $(group).prop("checked", false);
  	$(group).parent().removeClass("is-checked");
    $box.prop("checked", true);
  	$box.parent().addClass("is-checked");
  } 
  else 
  {
    $box.prop("checked", false);
  	$box.parent().removeClass("is-checked");
  }
});