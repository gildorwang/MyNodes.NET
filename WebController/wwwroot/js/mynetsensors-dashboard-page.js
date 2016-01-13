﻿/*  MyNetSensors 
    Copyright (C) 2015 Derwish <derwish.pro@gmail.com>
    License: http://www.gnu.org/licenses/gpl-3.0.txt  
*/



var gatewayHardwareConnected = null;
var signalRServerConnected = null;

var sliderUpdateInterval = 50; //increase this interval if you get excaption on moving slider
var elementsFadeTime = 300;

//var nodes;

var slidersArray = [];
var rgbSlidersArray = [];
var rgbwSlidersArray = [];
setInterval(sendSliders, sliderUpdateInterval);
//var ignoreSendingSwitchId;


$(function () {

    //configure signalr
    var clientsHub = $.connection.clientsHub;

    clientsHub.client.OnConnectedEvent = function () {
        hardwareStateChanged(true);
    };

    clientsHub.client.OnDisconnectedEvent = function () {
        hardwareStateChanged(false);
    };

    clientsHub.client.OnClearNodesListEvent = function () {
        var n = noty({ text: 'Nodes deleted from the database!', type: 'error' });
        $('#panelsContainer').html(null);
    };


    clientsHub.client.OnNewUINodeEvent = function (node) {
        createNode(node);
    };

    clientsHub.client.OnUINodeUpdatedEvent = function (node) {
        updateNode(node);
    };

    clientsHub.client.OnUINodeDeleteEvent = function (sensor) {
        deleteNode(sensor);
    };


    $.connection.hub.start();

    $.connection.hub.stateChanged(function (change) {
        if (change.newState === $.signalR.connectionState.reconnecting) {
            noty({ text: 'Web server is not responding!', type: 'error', timeout: false });
            signalRServerConnected = false;
        }
        else if (change.newState === $.signalR.connectionState.connected) {
            if (signalRServerConnected == false) {
                noty({ text: 'Connected to web server.', type: 'alert', timeout: false });
                getIsHardwareConnected();
                getNodes();
            }
            signalRServerConnected = true;
        }
    });

    // var connection = $.connection(clientsHub);
    // connection.stateChanged(signalrConnectionStateChanged);
    //connection.start({ waitForPageLoad: true });

    getIsHardwareConnected();
    getNodes();
});



function getIsHardwareConnected() {
    $.ajax({
        url: "/GatewayAPI/IsHardwareConnected/",
        type: "POST",
        success: function (connected) {
            hardwareStateChanged(connected);
        }
    });
}



function hardwareStateChanged(connected) {
    if (connected) {
        $('#panelsContainer').fadeIn(elementsFadeTime);
    } else {
        $('#panelsContainer').fadeOut(elementsFadeTime);
    }

    if (connected && gatewayHardwareConnected === false) {
        noty({ text: 'Gateway hardware is online.', type: 'alert', timeout: false });
    } else if (!connected) {
        noty({ text: 'Gateway hardware is offline!', type: 'error', timeout: false });
    }

    gatewayHardwareConnected = connected;
}



function getNodes() {
    $.ajax({
        url: "/Dashboard/GetUINodes/",
        type: "POST",
        success: function (nodes) {
            onReturnNodes(nodes);
        }
    });
}

function onReturnNodes(nodes) {
    //    var temp = elementsFadeTime;
    //   elementsFadeTime = 0;
    //  $('#panelsContainer').html(null);
    //  slidersArray.length = 0;
    //  rgbSlidersArray.length = 0;
    //  rgbwSlidersArray.length = 0;

    for (var i = 0; i < nodes.length; i++) {
        createNode(nodes[i]);
    }
    //elementsFadeTime = temp;
}



var panelTemplate = Handlebars.compile($('#panelTemplate').html());
var labelTemplate = Handlebars.compile($('#labelTemplate').html());
var progressTemplate = Handlebars.compile($('#progressTemplate').html());
var buttonTemplate = Handlebars.compile($('#buttonTemplate').html());
var toggleButtonTemplate = Handlebars.compile($('#toggleButtonTemplate').html());
var sliderTemplate = Handlebars.compile($('#sliderTemplate').html());
var rgbSlidersTemplate = Handlebars.compile($('#rgbSlidersTemplate').html());
var rgbwSlidersTemplate = Handlebars.compile($('#rgbwSlidersTemplate').html());


function createPanel(node) {
    //create new
    $(panelTemplate(node)).hide().appendTo("#panelsContainer").fadeIn(elementsFadeTime);
    if (node.PanelId == 0)
        $('#panelTitle' + node.PanelId).html("Main Panel");
}




function createNode(node) {
    //create new panel
    if ($('#panel' + node.PanelId).length == 0) {
        createPanel(node);
    }

    if (node.Type == "UI/Label") {
        $(labelTemplate(node)).hide().appendTo("#uiContainer" + node.PanelId).fadeIn(elementsFadeTime);
    }

    if (node.Type == "UI/Progress") {
        $(progressTemplate(node)).hide().appendTo("#uiContainer" + node.PanelId).fadeIn(elementsFadeTime);
    }

    if (node.Type == "UI/Button") {
        $(buttonTemplate(node)).hide().appendTo("#uiContainer" + node.PanelId).fadeIn(elementsFadeTime);
        $('#button-' + node.Id).click(function () {
            sendButtonClick(node.Id);
        });
    }

    if (node.Type == "UI/Toggle Button") {
        $(toggleButtonTemplate(node)).hide().appendTo("#uiContainer" + node.PanelId).fadeIn(elementsFadeTime);
        $('#button-' + node.Id).click(function () {
            sendToggleButtonClick(node.Id);
        });
    }

    if (node.Type == "UI/Slider") {
        $(sliderTemplate(node)).hide().appendTo("#uiContainer" + node.PanelId).fadeIn(elementsFadeTime);

        var slider = $("#slider-" + node.Id)[0];
        noUiSlider.create(slider, { start: 0, connect: 'lower', animate: false, range: { 'min': 0, 'max': 100 } });

        slidersArray.push({
            Id: node.Id,
            lastVal: node.Value
        });
    }

    if (node.Type == "UI/RGB Sliders") {
        $(rgbSlidersTemplate(node)).hide().appendTo("#uiContainer" + node.PanelId).fadeIn(elementsFadeTime);

        var r = hexToRgb(node.Value).r;
        var g = hexToRgb(node.Value).g;
        var b = hexToRgb(node.Value).b;
        if (isNaN(r)) r = 0;
        if (isNaN(g)) g = 0;
        if (isNaN(b)) b = 0;

        var sliderR = $("#slider-" + node.Id + "-r")[0];
        var sliderG = $("#slider-" + node.Id + "-g")[0];
        var sliderB = $("#slider-" + node.Id + "-b")[0];

        noUiSlider.create(sliderR, { start: 0, connect: 'lower', animate: false, range: { 'min': 0, 'max': 255 } });
        noUiSlider.create(sliderG, { start: 0, connect: 'lower', animate: false, range: { 'min': 0, 'max': 255 } });
        noUiSlider.create(sliderB, { start: 0, connect: 'lower', animate: false, range: { 'min': 0, 'max': 255 } });

        rgbSlidersArray.push({
            Id: node.Id,
            lastR: r,
            lastG: g,
            lastB: b
        });
    }


    if (node.Type == "UI/RGBW Sliders") {
        $(rgbwSlidersTemplate(node)).hide().appendTo("#uiContainer" + node.PanelId).fadeIn(elementsFadeTime);

        var r = hexToRgbw(node.Value).r;
        var g = hexToRgbw(node.Value).g;
        var b = hexToRgbw(node.Value).b;
        var w = hexToRgbw(node.Value).w;
        if (isNaN(r)) r = 0;
        if (isNaN(g)) g = 0;
        if (isNaN(b)) b = 0;
        if (isNaN(w)) w = 0;

        var sliderR = $("#slider-" + node.Id + "-r")[0];
        var sliderG = $("#slider-" + node.Id + "-g")[0];
        var sliderB = $("#slider-" + node.Id + "-b")[0];
        var sliderW = $("#slider-" + node.Id + "-w")[0];

        noUiSlider.create(sliderR, { start: 0, connect: 'lower', animate: false, range: { 'min': 0, 'max': 255 } });
        noUiSlider.create(sliderG, { start: 0, connect: 'lower', animate: false, range: { 'min': 0, 'max': 255 } });
        noUiSlider.create(sliderB, { start: 0, connect: 'lower', animate: false, range: { 'min': 0, 'max': 255 } });
        noUiSlider.create(sliderW, { start: 0, connect: 'lower', animate: false, range: { 'min': 0, 'max': 255 } });

        rgbwSlidersArray.push({
            Id: node.Id,
            lastR: r,
            lastG: g,
            lastB: b,
            lastW: b
        });
    }

    updateNode(node);
}

function updateNode(node) {
    $('#activity' + node.PanelId).show().fadeOut(150);

    if (node.Type == "UI/Label") {
        if (node.Value == null)
            node.Value = "NULL";

        $('#labelName-' + node.Id).html(node.Name);
        $('#labelValue-' + node.Id).html(node.Value);
    }

    if (node.Type == "UI/Progress") {
        //if (node.Value == null)
        //    node.Value = 0;

        if (node.Value > 100)
            node.Value = 100;

        if (node.Value < 0)
            node.Value = 0;

        $('#progressName-' + node.Id).html(node.Name);
        $('#progressBar-' + node.Id).progress({
            percent: node.Value,
            showActivity: false
        });
    }

    if (node.Type == "UI/Button" || node.Type == "UI/Toggle Button") {
        $('#buttonName-' + node.Id).html(node.Name);
    }

    if (node.Type == "UI/Toggle Button") {
        if (node.Value == "1")
            $('#button-' + node.Id).addClass("blue");
        else
            $('#button-' + node.Id).removeClass("blue");
    }

    if (node.Type == "UI/Slider") {
        $('#sliderName-' + node.Id).html(node.Name);
        $("#slider-" + node.Id)[0].noUiSlider.set(node.Value);
        updateSliderInArray(node.Id, node.Value);
    }

    if (node.Type == "UI/RGB Sliders") {
        var r = hexToRgb(node.Value).r;
        var g = hexToRgb(node.Value).g;
        var b = hexToRgb(node.Value).b;
        if (isNaN(r)) r = 0;
        if (isNaN(g)) g = 0;
        if (isNaN(b)) b = 0;

        $('#sliderName-' + node.Id).html(node.Name);
        $("#slider-" + node.Id + "-r")[0].noUiSlider.set(r);
        $("#slider-" + node.Id + "-g")[0].noUiSlider.set(g);
        $("#slider-" + node.Id + "-b")[0].noUiSlider.set(b);
        updateRgbSlidersInArray(node.Id, node.Value);
    }

    if (node.Type == "UI/RGBW Sliders") {
        var r = hexToRgbw(node.Value).r;
        var g = hexToRgbw(node.Value).g;
        var b = hexToRgbw(node.Value).b;
        var w = hexToRgbw(node.Value).w;
        if (isNaN(r)) r = 0;
        if (isNaN(g)) g = 0;
        if (isNaN(b)) b = 0;
        if (isNaN(w)) w = 0;

        $('#sliderName-' + node.Id).html(node.Name);
        $("#slider-" + node.Id + "-r")[0].noUiSlider.set(r);
        $("#slider-" + node.Id + "-g")[0].noUiSlider.set(g);
        $("#slider-" + node.Id + "-b")[0].noUiSlider.set(b);
        $("#slider-" + node.Id + "-w")[0].noUiSlider.set(w);
        updateRgbwSlidersInArray(node.Id, node.Value);
    }
}



function deleteNode(node) {
    $('#node' + node.Id).fadeOut(elementsFadeTime, function () { $(this).remove(); });
}





function sendButtonClick(nodeId) {
    $.ajax({
        url: "/Dashboard/ButtonClick/",
        type: "POST",
        data: { 'nodeId': nodeId }
    });
}

function sendToggleButtonClick(nodeId) {
    $.ajax({
        url: "/Dashboard/ToggleButtonClick/",
        type: "POST",
        data: { 'nodeId': nodeId }
    });
}

function sendSliderChange(nodeId, value) {
    $.ajax({
        url: "/Dashboard/SliderChange/",
        type: "POST",
        data: { 'nodeId': nodeId, 'value': value }
    });
}

function sendRGBSlidersChange(nodeId, value) {
    $.ajax({
        url: "/Dashboard/RGBSlidersChange/",
        type: "POST",
        data: { 'nodeId': nodeId, 'value': value }
    });
}

function sendRGBWSlidersChange(nodeId, value) {
    $.ajax({
        url: "/Dashboard/RGBWSlidersChange/",
        type: "POST",
        data: { 'nodeId': nodeId, 'value': value }
    });
}





//    //ON-OFF BUTTON
//    if (sensor.dataType == mySensors.sensorDataType.V_TRIPPED
//            || sensor.dataType == mySensors.sensorDataType.V_STATUS) {
//        if ($("[name='toggle-" + id + "']").length == 0) {
//            //create new
//            $(toggleTemplate(sensor)).hide().appendTo("#dataPanel" + id).fadeIn(elementsFadeTime);

//            $("[name='toggle-" + id + "']").prop('checked', sensor.state == "1");

//            $("[name='toggle-" + id + "']").click(function () {
//                if (ignoreSendingSwitchId == id)
//                    return;

//                var state = $(this).is(":checked");

//                var toggle = this.name.split("-");
//                var val = state == true ? 1 : 0;
//                sendSensor(toggle[1], toggle[2], val);
//            });
//        } else {
//            //update
//            ignoreSendingSwitchId = id;
//            $("[name='toggle-" + id + "']").prop('checked', sensor.state == "1");
//            ignoreSendingSwitchId = null;
//        }
//    }


//    }
//        //IR SEND
//    else if (sensor.dataType == mySensors.sensorDataType.V_IR_SEND) {


//        if ($("[name='textbox-" + id + "']").length == 0) {
//            //create new
//            $(irSendTemplate(sensor)).hide().appendTo("#dataPanel" + id).fadeIn(elementsFadeTime);


//            $("[name='button-" + id + "']").click(function () {
//                var code = $("[name='textbox-" + id + "']").val();
//                sendSensor(sensor.nodeId, sensor.sensorId, code);
//            });

//        } else {
//            //update

//        }
//    }




function sendSliders() {

    for (var i = 0; i < slidersArray.length; i++) {
        var id = slidersArray[i].Id;
        var currentVal = $("#slider-" + id)[0].noUiSlider.get();
        currentVal = Math.round(currentVal);

        if (!isNaN(currentVal) && currentVal != slidersArray[i].lastVal) {

            slidersArray[i].lastVal = currentVal;
            sendSliderChange(slidersArray[i].Id, slidersArray[i].lastVal);
        }
    }

    for (var i = 0; i < rgbSlidersArray.length; i++) {
        var id = rgbSlidersArray[i].Id;
        var currentR = $("#slider-" + id + "-r")[0].noUiSlider.get();
        var currentG = $("#slider-" + id + "-g")[0].noUiSlider.get();
        var currentB = $("#slider-" + id + "-b")[0].noUiSlider.get();

        currentR = Math.round(currentR);
        currentG = Math.round(currentG);
        currentB = Math.round(currentB);


        if (currentR != rgbSlidersArray[i].lastR ||
            currentG != rgbSlidersArray[i].lastG ||
            currentB != rgbSlidersArray[i].lastB) {

            var hex = RgbToHex(currentR, currentG, currentB);
            updateRgbSlidersInArray(id, hex);

            sendRGBSlidersChange(rgbSlidersArray[i].Id,hex);
        }
    }

    for (var i = 0; i < rgbwSlidersArray.length; i++) {
        var id = rgbwSlidersArray[i].Id;
        var currentR = $("#slider-" + id + "-r")[0].noUiSlider.get();
        var currentG = $("#slider-" + id + "-g")[0].noUiSlider.get();
        var currentB = $("#slider-" + id + "-b")[0].noUiSlider.get();
        var currentW = $("#slider-" + id + "-w")[0].noUiSlider.get();

        currentR = Math.round(currentR);
        currentG = Math.round(currentG);
        currentB = Math.round(currentB);
        currentW = Math.round(currentW);

        if (currentR != rgbwSlidersArray[i].lastR ||
            currentG != rgbwSlidersArray[i].lastG ||
            currentB != rgbwSlidersArray[i].lastB ||
            currentW != rgbwSlidersArray[i].lastW) {

            var hex = RgbwToHex(currentR, currentG, currentB, currentW);
            updateRgbwSlidersInArray(id, hex);

            sendRGBWSlidersChange(rgbwSlidersArray[i].Id, hex);
        }
    }
}

function updateSliderInArray(sliderId, lastVal) {
    for (var i = 0; i < slidersArray.length; i++) {
        if (slidersArray[i].Id == sliderId)
            slidersArray[i].lastVal = lastVal;
    }
}

function updateRgbSlidersInArray(sliderId, lastHex) {
    for (var i = 0; i < rgbSlidersArray.length; i++) {
        if (rgbSlidersArray[i].Id == sliderId) {
            rgbSlidersArray[i].lastR = hexToRgb(lastHex).r;
            rgbSlidersArray[i].lastG = hexToRgb(lastHex).g;
            rgbSlidersArray[i].lastB = hexToRgb(lastHex).b;
        }
    }
}


function updateRgbwSlidersInArray(sliderId, lastHex) {
    for (var i = 0; i < rgbwSlidersArray.length; i++) {
        if (rgbwSlidersArray[i].Id == sliderId) {
            rgbwSlidersArray[i].lastR = hexToRgbw(lastHex).r;
            rgbwSlidersArray[i].lastG = hexToRgbw(lastHex).g;
            rgbwSlidersArray[i].lastB = hexToRgbw(lastHex).b;
            rgbwSlidersArray[i].lastW = hexToRgbw(lastHex).w;
        }
    }
}

