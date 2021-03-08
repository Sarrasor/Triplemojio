const LOCAL = true;

var SERVER_URL = "https://" + window.location.hostname + ":1337";
if(!LOCAL)
{
  SERVER_URL = "localhost";
}
