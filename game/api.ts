/*
import { game } from "./game";

function getUrl() {
  if(game.uiData.isProd) return game.prodApiUrl;
  return game.devApiUrl;
}

export function logEvent(label: string, content: string) {
  try {
    if(localStorage.getItem("noLog") === "true") {
      console.log("NOT LOGGING");
      return;
    }
    if(!game.uiData.logInDev && !game.uiData.isProd) {
      return;
    }
    if(!content) content = "";

    let userAgent = navigator.userAgent;
    let event: any = {
      UserAgent: userAgent,
      Label: label,
      Content: content
    };

    $.ajax({
      url: getUrl() + "/create",
      type: 'post',
      dataType: 'json',
      contentType: 'application/json',
      success: function (data) {
        console.log(data);
      },
      data: JSON.stringify(event)
    });
  }
  catch { }
}
*/