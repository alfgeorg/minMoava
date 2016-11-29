/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    page:false,


    // Application Constructor
    initialize: function(obj) {
        app.page = obj.page;
        this.bindEvents();

    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        $(document).ready(function() {
            // are we running in native app or in a browser?
            window.isphone = false;
            if(document.URL.indexOf("http://") === -1
                && document.URL.indexOf("https://") === -1) {
                window.isphone = true;
            }

            if( window.isphone ) {
                document.addEventListener('deviceready', app.onDeviceReady, false);
            } else {
                app.initStartPage();
            }
        });


    },

    //things to do for the DEVICE
    onDeviceReady: function() {


        //Push
        Push.setupPush(); //Should this be called here?
        app.initStartPage();
        document.addEventListener("resume", app.onResumeApp, false);
    },

    /**
     * When opening app again after clicked home butten
     */
    onResumeApp: function() {
        //Update messages
        Info.init();
    },

    // Things to do with DOM
    initStartPage: function() {
//cue the page loader

        Index.init();
        Cal.init();
        Files.init();
        Settings.init();
        Info.init();
        nav.init();
        $( ".navbar" ).on( "navbarcreate", function( event, ui ) {
          /*  var active = $(".ui-btn-active").prop('href');
            //var url = active.href;
            var hash = active.substring(active.indexOf('#')+1);
            alert(hash);*/

        } );
        /*var message =  Info.findUrlsInText("Sjekker noen flere linker: http://nrk.no vg.no google.no. http://husabo.eigersundskolen.no/index.php?show=tests&id=84&key=7bfd4c49&action=doTest ");

        $("#messageContent").html(message);
        $.mobile.changePage('#dialogMessages');*/


    }
};

/**
 * When click on tab - we update content
 * @type {{init: nav.init}}
 */
var nav = {
  init: function() {
      $(".navbar a").on("click", function(e) {
          var url = this.href;
          var hash = url.substring(url.indexOf('#')+1);
            $(this).addClass("ui-btn-active");
          switch(hash) {
              case 'calendar':
                  Cal.init();
                  break;
              case 'news':
                  Index.init();
                  break;
              case 'info':
                  Info.init();
                  break;
              case 'files':
                  Files.init();
                  break;
          }
      });
  }
};

var Cal = {
    site: '',
    appTime: '',
    calFields: '',
    calFieldsOff: '',
    currentSavedSettings: '',
    user: 0,
    key: '',

    init: function() {

        if(localStorage.getItem("site"))
        {
            Cal.site = localStorage.getItem('site');
        }
        if(localStorage.getItem('user'))
        {
            var userInfo = JSON.parse(localStorage.getItem("user"));
            Cal.user = userInfo.id;
            Cal.key = userInfo.key;
        }
        //Start with a date long time ago so we force first update
        var d = new Date(2000, 1, 1, 1, 0, 0, 0);
        Cal.appTime = d.getTime();
        var setting = '';
        //do we have saved settings in local storage
        if(localStorage.getItem("cal"))
        {
            setting = JSON.parse(localStorage.getItem("cal"));
            Cal.calFields = JSON.stringify(setting.on);
            Cal.calFieldsOff = JSON.stringify(setting.off);
            Cal.currentSavedSettings = localStorage.getItem("cal");
        }
        //Not use this, as our backend is different for each user APP - Should stop this from running at all...
        /*
         Cal.Articles.all().whenChanged( function (articless) {
         //Index.getArticles(0);
         //$("#myLog").append("whenChanged - ");
         });
         */

        //call every time page is get visible
       
            //Check if site has changed in settings - if so we empty page
            if(localStorage.getItem("site"))
            {
                if(Cal.site != localStorage.getItem('site'))
                {
                    $("#contEvents").html('Dine valg gav ikke noe innhold');
                };
                //update site
                Cal.site = localStorage.getItem('site');
            }
            //we update if local storage has changed
            if(localStorage.getItem("cal") && localStorage.getItem("cal") != Cal.currentSavedSettings)
            {
                //reload with new settings
                setting = JSON.parse(localStorage.getItem("cal"));
                Cal.calFields = JSON.stringify(setting.on);
                Cal.calFieldsOff = JSON.stringify(setting.off);
                //Set time back again to force update
                Cal.appTime = d.getTime();
                Cal.currentSavedSettings = localStorage.getItem("cal");
                $("#contEvents").html('Dine valg gav ikke noe innhold');
                Cal.getEvents(0);
            }
            else
            {
                //We just check for updates
                $( document ).ready(function() {
                    //check if settings is set - can have been deleted when selecting site
                    if(!localStorage.getItem('cal'))
                    {
                        Cal.calFields = '';//empty fields
                        Cal.calFieldsOff = '';//empty fields
                        Cal.currentSavedSettings = '';//empty settings
                        Cal.appTime = d.getTime();


                    }
                    Cal.getEvents(0);
                });

            }

    },

    /**
     * Structurdata:
     * data.info.lastUpdate: last time changes where made in calendar - use to update APP if nessessary
     * data.events - all events loop trought: title, description
     */
    getEvents: function(eventID) {
        $.mobile.loading( 'show' );
        var url = Cal.site + '/moavaapi/cal';
        if(eventID > 0)
        {
            url += '/'+eventID;
        }
        $.ajax({
            type: "POST",
            url: url,
            data: 'user=' + Cal.user + '&key=' + Cal.key + '&fields=' + Cal.calFields + '&fieldsOff=' + Cal.calFieldsOff + '&time=' + Cal.appTime,
            success: function(data) {
               // $("#myLog").append('Info lastUpdate: ' + data.info.lastUpdate);
                // console.log(data);

                //$("#myLog").append('Req update '+Cal.appTime+' ('+data.events.length+') - ');
                if(data.events.length > 0)
                {
                    if(eventID > 0)
                    {
                        Cal.listEvent(data.events[0]);
                    }
                    else {
                        if(Cal.appTime < data.info.lastUpdate) Cal.listCalList(data.events);
                        Cal.appTime = data.info.lastUpdate;//We have now updated our app, and update last update time.

                        //console.log('Runs update (' + Cal.appTime + ' ' + data.info.lastUpdate + ') - ');
                        //$("#myLog").append('Runs update (AppTime: ' + Cal.appTime + ' LastServerTime: ' + data.info.lastUpdate + ') - ');
                    }
                }

            },
            dataType: 'json'
        });

    },


    listCalList: function(data) {

        var tempDayStr = '';
        c = '';
        c += '<ul class="ui-listview" id="contEvents">';
        $.each(data, function(index, cal){
            var selColor = 'balanced';

            var dayStr = cal.dayName + ' ' + cal.day + '.' + cal.month;
            //Print only same day once
            if(dayStr != tempDayStr)
            {


                c += '<li class="ui-li-divider ui-bar-a ui-first-child" data-role="list-divider" role="heading">';
                c += dayStr;
                c += '</li>';
                tempDayStr = dayStr;
            }

//console.log('CAL: ' +cal.title);
            /*c += '<li>';
            c += '<a href="#dynamic" class="getContentEvent ui-btn ui-btn-icon-right ui-icon-carat-r" data-transition="slide" data-id="'+cal.id+'">';
            c += '<span class="ui-li-count" style="left:1em;right:auto;border:none;top:2.5em">' + cal.timeFrom + '<br>' + cal.timeTo + '</span>';
            c += '<img src="' + cal.mainImg.imgUrl.small+'" />';
            c += '<h2 style="margin-left:55px;">' + cal.title +'</h2>';
            c += '<p style="margin-left:55px;">' + cal.ingress + '</p>';
            c += '</a>';
            c += '</li>';*/




                c += '<li class="ui-li-has-thumb">';
                c += '<a href="#dynamic" class="getContent ui-btn ui-btn-icon-right ui-icon-carat-r" data-transition="slide" data-id="'+cal.id+'">';
                c += '<span class="ui-li-count" style="font-size: 1em; left:1em;right:auto;border:none;top:1.5em;padding:0;text-align:left;">';

                if(cal.timeFrom != '') c += cal.timeFrom + ' -';
                c += '<br>';
                if(cal.timeTo != '' && cal.timeFrom == '') c += '- ';
                c += cal.timeTo + '</span>';

                c += '<h2>'+cal.title+'</h2>';
                c += '<p>'+cal.ingress+'</p>';
                if(cal.mainImg != '')
                {
                    var imgSrc = cal.mainImg.imgUrl.small;
                    if(cal.mainImg.type == 'video')
                    {
                        imgSrc = cal.mainImg.vidImg;
                    }
                    c += '<img src="' + imgSrc +'" width="120px" />';
                }
                c += '</a>';
                c += '</li>';




        });
        c += '</ul>';





        $("#contEvents").html(c);
        $.mobile.loading( 'hide' );
        //prevent from scrolling to top
        $("#contEvents a").on("click", function(e) {
            var eventID = $(this).data('id');
            Cal.getEvents(eventID);

        });
    },


    listEvent: function(event) {

        //date string
        var dayStr = event.dayName + ' ' + event.day + '.' + event.month;
        if(event.timeFrom != '')
        {
            dayStr += ' kl. ' + event.timeFrom;
        }
        //Add to date/time if exist
        if(event.dayNameTo != '' || event.timeTo != '')
        {
            dayStr += ' - ';
            //add day?
            if(event.dayNameTo != '')
            {
                dayStr += event.dayNameTo + ' ' + event.dayTo + '.' + event.monthTo + '.' + event.yearTo + ' ';
            }
            if(event.timeTo != '')
            {
                dayStr += 'kl. ' +event.timeTo;
            }
        }

        //title, text and main image
        var mainImgID = '';
        var c = '';
        c += '<div">';
        //title
        c += '<h2>'+event.title+'</h2>';
        //date
        c += '<h3>'+dayStr+'</h3>';
        //ingress
        if(event.ingress != '')
        {
            c += '<p>'+event.ingress+'</p>';
        }
        //main image
        if(event.mainImg != '')
        {
            c += '<div class="" style="padding:4px;">';
            //title
            c += '<h4>' + event.mainImg.title + '</h4>';
            //main image
            //Video?
            if(event.mainImg.type == 'video')
            {
                c += '<video width="100%" controls  poster="'+event.mainImg.vidImg+'">';
                c += '<source src="'+event.mainImg.imgUrl.medium+'" type="video/mp4">';
                c += '</video>';
            }
            else //image
            {
                c += '<img class="" style="width:100%;" src="'+event.mainImg.imgUrl.medium+'" />';
            }
            //ingress
            if(event.mainImg.ingress != '')
            {
                c += '<p>' + event.mainImg.ingress + '</p>';
            }
            c += '</div>';
            mainImgID = event.mainImg.id;
        }
        //Extra text
        if(event.text != '')
        {
            c += '<div>'+event.text+'</div>';
        }

        c += '</div>';

        //Other images, videos and files
        var img = '';


        $.each(event.images, function(index, oImg){
            //dont repeat mainImg
            if(oImg.id != mainImgID) {
                img += '<div class="" style="padding:4px;">';
                img += '<h4>' + oImg.title + '</h4>';
                //Video?
                if(oImg.type == 'video')
                {
                    img += '<video width="100%" controls  poster="'+oImg.vidImg+'">';
                    img += '<source src="'+oImg.imgUrl.medium+'" type="video/mp4">';
                    img += '</video>';
                }
                else //image
                {
                    img += '<img class="" style="width:100%;" src="'+oImg.imgUrl.medium+'" />';
                }
                if (oImg.ingress != '') {
                    img += '<p>' + oImg.ingress + '</p>';
                }
                img += '</div>';
            }
        });

        //Files
        var f = '';
        if(event.files.length > 0)
        {
            f = '<h4>Vedlegg</h4>';

            $.each(event.files, function(index, file){
                f += '<div class="card filesCard" data-fileurl="'+file.fileUrl+'">';
                f += '<div class="item item-divider">';
                f += file.title;
                f += '</div>';
                if(file.ingress != '')
                {
                    f += '<div class="item item-text-wrap">';
                    f += file.ingress;
                    f += '</div>';
                }
                f += '</div>';
            });

        }


        //$("#contEvent").html(c);
        //$("#contImg").html(img);
        //$("#contFiles").html(f);
        var closeBtn = '<a href="#" class="ui-btn ui-icon-carat-l ui-btn-icon-left" data-rel="back">Tilbake</a>';
        /*$("#contArticle").html(c);
         $("#contImg").html(img);
         $("#contFiles").html(f);*/
        $("#contDynamic").html(c+img+f+closeBtn);
        $.mobile.loading( 'hide' );
        $(".filesCard").on("click", Files.onFile);
    }

};



var Settings = {
    art: {},
    site: '',
    cfg: {
        showFieldSettings: 1,
        showLogIn: 1
    },
    user: 0,
    key: '',

    init: function() {
        //If site is set - we dont show this at startup
        if(localStorage.getItem('site') && localStorage.getItem('site') != '')
        {

        }

        if(localStorage.getItem('user'))
        {
            var userInfo = JSON.parse(localStorage.getItem("user"));
            Settings.user = userInfo.id;
            Settings.key = userInfo.key;
           // $("#myLog").append('User: '+Settings.user + ' Key: ' + Settings.key);
        }

        //Finish - Save settings and close initial view
        $(".btnFinish").on("click", function() {
            if($(".chbSetting:checked").length == 0) {
                alert("Du må velge minst et felt");
                return;
            }
            else {
                if (Settings.site != '') {

                    Settings.saveSettings('art');
                    Settings.saveSettings('file');
                    Settings.saveSettings('cal');


                    //get all fields
                    var fields = '';

                    $(".chbSetting:checked").each(function(index, setting){
                        fields += '&fields[]=' + $(setting).val();
                    });
                    //Are we logged in?
                    var user = 0;
                    if(localStorage.getItem('user'))
                    {
                        user = localStorage.getItem('user');
                    }

                    Settings.setPushSettings(fields, user);


                    //register device
                   // Push.setupPush();

                    //save settings

                    //close modal
                     // location.reload(); //Trouble? Wait for finish push?
                    //$('.ui-dialog').dialog('close');
                }
            }
        });

    

            //set site
            if(localStorage.getItem('site'))
            {
                Settings.site = localStorage.getItem('site');
            }

            //get select sites
            Settings.getSites();
            if(Settings.site != '')
            {
                Settings.getSettings();
            }


    },

    setPushSettings: function(fields, user) {
        //save the deviceToken / registration ID to your Push Notification Server
        var currentEndpointArn = '';
        if(localStorage.getItem('endpointArn'))
        {
            currentEndpointArn = localStorage.getItem('endpointArn');
            //localStorage.removeItem('endpointArn');
        }

        //alert("Set settings " + Settings.site + '/moavaapi/pushregister/' + localStorage.getItem('registrationId') + 'endpointArn=' + currentEndpointArn + fields + '&user=' + user);
        $.ajax({
            type: "POST",
            url: Settings.site + '/moavaapi/pushregister/' + localStorage.getItem('registrationId'),
            data: 'endpointArn=' + currentEndpointArn + fields + '&user=' + user,
            success: function(data) {
                if(currentEndpointArn != data[0].endpointArn)
                {
                    if(localStorage.getItem('site')) Settings.removeDevicePush(currentEndpointArn, localStorage.getItem('site'));
                    localStorage.removeItem('endpointArn');

                }
                localStorage.setItem('endpointArn', data[0].endpointArn);
                //if we have set fields, we reload with new settings
                if(fields != '') {
                    location.reload();
                }
            },
            fail: function(response) {
                //alert("Fail "+ response);
            },
            error: function(response) {
                //alert("Fail "+ response);
            },
            dataType: 'json'
        });
    },

    getSites: function() {
        $.mobile.loading( 'show' );
        var c = '';
        //This url will be changed to a common place for all sites
        $.post( "http://trunk.moava.no/moavaapi/settings", function( data ) {


            c += '<form id="formSites">';
            c +=  Settings.listSelectSite( data.site);
            c += '</form>';
            $("#contSites").html(c);
            $.mobile.loading( 'hide' );
            $("#selSite").on("change", Settings.onSelectSite);
        });


    },

    onSelectSite: function(e) {

        //if we change site we delete push settings from old site
        if(localStorage.getItem('site') && localStorage.getItem('site') != '' && localStorage.getItem("endpointArn") && localStorage.getItem("endpointArn") != '')
        {
            Settings.removeDevicePush(localStorage.getItem("endpointArn"), localStorage.getItem("site"));
        }
        var siteUrl = this.value;
        Settings.site = siteUrl;
        //delete settings in local storage
       localStorage.removeItem('site');
        localStorage.removeItem('user');
        localStorage.removeItem('art');
        localStorage.removeItem('cal');
        localStorage.removeItem('file');

        //empty settings:
        $("#contSettings").html('');
        $("#contLogIn").html('');


        //get settings for this school
        if(Settings.site != '')
        {
            //save url to localstorage
            localStorage.setItem('site', siteUrl);

            //get checkboxes
            Settings.getSettings();
        }
        else {
            Settings.init();
        }

    },

    removeDevicePush: function(endpointArn, site) {
        $.ajax({
            type: "POST",
            url: site + '/moavaapi/pushregisteroff/',
            data: 'endpointArn='+endpointArn,
            success: function (data) {

            },
            dataType: 'json'
        });


    },

    listSelectSite: function(data) {
        var c = '<h2>Velg skole</h2>';
        c += '<select id="selSite">';
        c += '<option value="">Velg skole</option>';
        $.each(data, function(index, site) {
            c += '<option value="' + site.url + '" ';
            if(site.url == Settings.site)
            {
                c += 'selected="selected" ';
            }
            c += '>' + site.title + '</option>';
        });

        c += '</select>';
        return c;
    },

    getSettings: function() {
        $.mobile.loading( 'show' );
        var c = '';
        //POST
        $.ajax({
            url: Settings.site + "/moavaapi/settings",
            type: 'POST',
            data: 'user=' + Settings.user + '&key=' + Settings.key,

            success: function(data)
            {
                //cfg

                Settings.cfg = data.cfg[0];




                //fields
                if(Settings.cfg.showFieldSettings == 1)
                {
                    c += '<h2>Nyheter</h2>';
                    if(data.art)
                    {
                        c +=  Settings.listSettingsOnOff('art', data.art);
                    }
                    else
                    {
                        c += '<p>Ingen nyhetsfelt tilgjengelig</p>';
                    }

                    c += '<h2>Filer</h2>';
                    if(data.file)
                    {
                        c +=  Settings.listSettingsOnOff('file', data.file);
                    }
                    else
                    {
                        c += '<p>Ingen filfelt tilgjengelig</p>';
                    }

                    c += '<h2>Kalendere</h2>';
                    if(data.cal)
                    {
                        c +=  Settings.listSettingsOnOff('cal', data.cal);
                    }
                    else
                    {
                        c += '<p>Ingen kalenderfelt tilgjengelig</p>';
                    }

                }
                //log in?
                Settings.cfg.showLogIn = data.cfg[0].showLogIn;
                if(Settings.cfg.showLogIn == 1 && !localStorage.getItem('user'))
                {
                    Settings.listLogin();
                }
                if(localStorage.getItem('user'))
                {
                    Settings.listLogOut();
                }


                $("#contSettings").html(c);
                $.mobile.loading( 'hide' );
                $("#feedbackLogin").html("");
                //Listeners to checkboxes
                /*
                 $(".chbSettingart").on("change", {what: 'art'}, Settings.onChbSetting);
                 $(".chbSettingfile").on("change", {what: 'file'}, Settings.onChbSetting);
                 $(".chbSettingcal").on("change", {what: 'cal'}, Settings.onChbSetting);
                 $(".btnCalColor").on("click", Settings.onBtnCalColor);
                 */
            },
            fail: function(response) {
                // alert("Fail "+ response);
            }

        });




    },

    listLogin: function() {
        c = '';
        c += '<h2>Logg inn</h2>';
        c += '<div class="list">';
        c += '<label class="item item-input">';
        c += '<span class="input-label">Brukenavn</span>';
        c += '<input type="text" id="username" autocapitalize="off" autocorrect="off" autocomplete="off">';
        c += '</label>';
        c += '<label class="item item-input">';
        c += '<span class="input-label">Passord</span>';
        c += '<input type="password" id="password">';
        c += '</label>';
        c += '</div>';

        c += '<button id="btnLogIn" class="button button-block button-balanced">';
        c += 'Logg inn';
        c += '</button>';
        $("#contLogIn").html(c);
        $("#btnLogIn").on("click", Settings.onLogIn);
    },

    listLogOut: function() {
        var cont = '';
        cont += '<button id="btnLogOut" class="button button-block button-assertive">';
        cont += 'Logg ut';
        cont += '</button>';
        $("#contLogIn").html(cont);
        $("#btnLogOut").on("click", Settings.onLogOut);
    },

    /**
     * Data in return is
     * id (userID - if > 0 you are logged in)
     * access - level of access 1,4,5,9
     * username
     * key - use to check access to own content, internal content etc.
     */
    onLogIn: function() {
        var username = $("#username").val();
        var password = $("#password").val();
        $("#feedbackLogin").html("Logger inn ...");
        if(localStorage.getItem('user'))
        {
            localStorage.removeItem('user');
        }
        $.ajax({
            type: "POST",
            url: Settings.site + '/moavaapi/login',
            data: 'username=' + username + '&password=' + password,
            success: function(data) {
                Settings.user = data.id;
                //var access = data.access;
                //var username = data.username;
                Settings.key = data.key;
                if(Settings.user > 0)//Log in OK
                {
                    //$("#feedbackLogin").html("Du er logget inn");
                    //save user settings
                    localStorage.setItem('user', JSON.stringify(data));
                    //we reload settings as we now can have new personal settings
                    //Settings.init();
                    //get checkboxes
                    Settings.getSettings();
                }
                else //Wrong login
                {
                    $("#feedbackLogin").html("Feil brukernavn/passord");
                }
            },
            dataType: 'json'
        });
    },

    onLogOut: function() {
        Settings.user = 0;
        Settings.key = '';
        localStorage.removeItem('user');
        //Settings.listLogin();
        //get checkboxes
        Settings.getSettings();
    },

    listSettingsOnOff: function(what, data) {

        var on = [];
        var off = [];
        var what = what;
        //if(what == 'art') $("#myLog").append(localStorage.getItem(what));
        if(localStorage.getItem(what))
        {
            var savedOnOff = JSON.parse(localStorage.getItem(what));
            //  $("#myLog").append('savedOnOff: ' + savedOnOff);
          
            var savedOn = savedOnOff.on;
            var savedOff = savedOnOff.off;

            for(var i=0;i<savedOn.length;i++)
            {
                on.push(parseInt(savedOn[i]));
               // $("#myLog").append("ON: " + on[i]);
            }
            for(var k=0;k<savedOff.length;k++)
            {
                off.push(parseInt(savedOff[k]));
              //  $("#myLog").append("OFF: " + off[k]);
            }



        }



        var c = '';
        c +=
            c += '<ul class="list">';
        $.each(data, function(index, setting){
            c += '<li class="item item-toggle">';
            c += setting.title;
            c += '<label class="toggle toggle-balanced">';
            c+= '<input type="checkbox" value="'+setting.id+'" class="chbSetting chbSetting'+what+'" ';
            //If set to on
            // $("#myLog").append('<li>'+setting.id+'>OFF: '+$.inArray(parseInt(setting.id), off)+' ON: '+$.inArray(parseInt(setting.id), on)+'</li>');
            if($.inArray(parseInt(setting.id), off) > -1)
            {
                // $("#myLog").append('TURNOFF');
            }
            else
            {
                c += 'checked="checked" ';
            }
            //if not exists in current setting (a new has been created on server), we set it to on
            //  if($.inArray(setting.id, selected.on) == -1 && $.inArray(setting.id, selected.off) == -1) c += 'checked="checked" ';
            c += '>';
            c += '<div class="track">';
            c += '<div class="handle"></div>';
            c += '</div>';
            c += '</label>';
            c += '</li>';


            //Calendars can set colors - Not for now - Need to know filedID - Not shure to use this..
            /*
             if(what == 'cal')
             {
             c += '<li>';
             c += Settings.listColorSelect(setting.id);
             c += '</li>';
             }
             */
        });
        c += '</ul>';
        return c;
    },

    saveSettings: function(what) {

        //empty local storage
        if(localStorage.getItem(what))
        {
            localStorage.removeItem(what);
        }
        //run trough all checkboxes and save on and off settings
        var selected = {};
        selected.on = [];
        selected.off = [];
        $(".chbSetting" + what).each(function(index, setting){
            if($(setting).is(':checked'))
            {
                selected.on.push($(setting).val());
            }
            else
            {
                selected.off.push($(setting).val());
            }
        });

        localStorage.setItem(what, JSON.stringify(selected));
         // $("#myLog").append(JSON.stringify(selected));

    },

    listColorSelect: function(cal) {
        var c = '';
        var colors = ['positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark'];
        var selColor = 'balanced';
        if(localStorage.getItem('calColors'))
        {
            var colorSettings = $.parseJSON(localStorage.getItem('calColors'));
            if(colorSettings['calColor_' + cal])
            {
                selColor = colorSettings['calColor_' + cal];
                // $("#myLog").append(selColor+' - ');
            }
        }


        c += '<div class="button-bar">';
        $.each(colors, function(i, colorName){
            c += '<a class="btnCalColor btnCalColor_' + cal + ' button button-small button-' + colorName + '" data-color="' + colorName + '" data-cal="' + cal + '">';
            if(colorName == selColor) c += '&#x2713;';//standard checked
            c += '</a>';
        });
        c += '</div>';


        /*
         c += '<div class="row">';
         c += '<div class="col positive">.col</div>';
         c += '<div class="col">.col</div>';
         c += '<div class="col">.col</div>';
         c += '<div class="col">.col</div>';
         c += '<div class="col">.col</div>';
         c += '</div>';
         */

        return c;

    },

    onBtnCalColor: function(e) {
        var colorName = $(this).data('color');
        var cal = $(this).data('cal');
        var selColors;
        //Uncheck all
        var colorButtons = $(".btnCalColor_" + cal);
        $.each(colorButtons, function(i, btn){

            if($(btn).data('color') == colorName)
            {
                $(btn).html('&#x2713;');
            }
            else
            {
                $(btn).html('');
            }

        });

        var allColorButtons = $(".btnCalColor");
        var selColors = {};
        if(localStorage.getItem('calColors'))
        {
            localStorage.removeItem('calColors');
        }
        $.each(allColorButtons, function(i, btn){
            if($(btn).html() != '')
            {
                selColors['calColor_' + $(btn).data('cal')] = $(btn).data('color')
            }
        });

        //save colors
        localStorage.setItem('calColors', JSON.stringify(selColors));

    }
};

var Index = {
    artFields: '',
    artFieldsOff: '',
    appTime: false,//a date to start with
    currentSavedSettings: '',
    site: '',
    user: 0,
    key:'',

    init: function() {

        Index.getNumberOfUnreadMessages();
/* -----------
        var pushNotification;
document.addEventListener("deviceready", function() {
        console.log('DEVICEREADY');
        $("#myLog").prepend('DEVICEREADY');
        pushNotification = window.plugins.pushNotification;

        // the result contains any error description text returned from the plugin call
        function errorHandler(error) {
            alert('error = ' + error);
        }

        //Messages while app is open
        function messageInForegroundHandler(notification) {
            //steroids.tabBar.selectTab(3);
            var badge = '!';
            if ( notification.sound || notification.soundname) {

                //handle the difference in payload from iOS and Android
                var sound = notification.sound || notification.soundname;
                var media = new Media(steroids.app.absolutePath + '/' + sound);
                media.play();
                console.log('sound: ' + sound);
            }

            if ( notification.badge ) {
                pushNotification.setApplicationIconBadgeNumber(function(){}, function(){}, notification.badge);
                // alert("badge!");
                var badgeNumber = notification.badge;
                badge = badgeNumber.toString();
            }
            supersonic.ui.tabs.update([{},{},{},{badge: badge}]);
            var notificationMessage = '';
            if(notification.message)
            {
                notificationMessage = notification.message;
            }
            if(notification.alert)
            {
                notificationMessage = notification.alert;
            }
            console.log('messageInForegroundHandler: ' + notificationMessage);
            console.log('badge: ' + notification.badge);
            //Show messages alert
            var options = {
                message: notificationMessage,
                buttonLabel: "Lukk"
            };

            supersonic.ui.dialog.alert("Ny melding!", options).then(function() {
                supersonic.logger.log("Alert closed.");
            });

        }

        pushNotification.onMessageInForeground( messageInForegroundHandler,errorHandler);





});


        //-----------*/




        if(localStorage.getItem("site"))
        {
            Index.site = localStorage.getItem('site');
        }
        if(localStorage.getItem('user'))
        {
            var userInfo = JSON.parse(localStorage.getItem("user"));
            Index.user = userInfo.id;
            Index.key = userInfo.key;
        }
        //Start with a date long time ago so we force first update
        var d = new Date(2000, 1, 1, 1, 0, 0, 0);
        Index.appTime = d.getTime();

        //do we have saved settings in local storage
        if(localStorage.getItem("art"))
        {
            var setting = JSON.parse(localStorage.getItem("art"));
            Index.artFields = JSON.stringify(setting.on);
            Index.artFieldsOff = JSON.stringify(setting.off);
            Index.currentSavedSettings = localStorage.getItem("art");
        }

        /*
         //Not use this, as our backend is different for each user APP - Should stop this from running at all...
         Index.Articles.all().whenChanged( function (articless) {
         //Index.getArticles(0);
         //$("#myLog").append("whenChanged - ");
         });
         */



            //Check if site has changed in settings - if so we empty page
            if(localStorage.getItem("site"))
            {
                if(Index.site != localStorage.getItem('site'))
                {
                    $("#contFirstArticle").html('Dine valg gav ikke noe innhold');
                    $("#contArticleList").html('');
                };
                //update site
                Index.site = localStorage.getItem('site');
            }
            // $("#myLog").append("WhenVisible - ");
            //we update if local storage has changed
            if(localStorage.getItem("art") && localStorage.getItem("art") != Index.currentSavedSettings)
            {
                //reload with new settings
                setting = JSON.parse(localStorage.getItem("art"));
                Index.artFields = JSON.stringify(setting.on);
                Index.artFieldsOff = JSON.stringify(setting.off);
                //Set time back again to force update
                Index.appTime = d.getTime();
                Index.currentSavedSettings = localStorage.getItem("art");
                Index.getArticles(0);
            }
            else
            {
                //We just check for updates
                $( document ).ready(function() {
                    //check if settings is set - can have been deleted when selecting site
                    if(!localStorage.getItem('art'))
                    {
                        Index.artFields = '';//empty fields
                        Index.artFieldsOff = '';//empty fields
                        Index.currentSavedSettings = '';//empty settings
                        Index.appTime = d.getTime();
                      //  $("#myLog").append("RESET 2 APPTIME");
                    }
                    Index.getArticles(0);
                });

            }




        //listeer Settings button
        $("#btnSettings").on("click", Index.onSettings);
        //   $("#btnNewArticle").on("click", Index.onNewArticle);//Not in use for now...
    },

    getNumberOfUnreadMessages: function() {
       // $("#myLog").append("unread??");
        if(localStorage.getItem("endpointArn")) {
            var endpointArn = localStorage.getItem("endpointArn");
            $.ajax({
                type: "POST",
                url: localStorage.getItem('site') + '/moavaapi/getNumberOfUnreadMessages/',
                data: 'endpointArn='+endpointArn,
                success: function (data) {
                    var badgeNumber = data[0].unread;
                    var badge = badgeNumber.toString();
                    /*var pushNotification = window.plugins.pushNotification;
                    pushNotification.setApplicationIconBadgeNumber(function(){}, function(){}, badge);
                    supersonic.ui.tabs.update([{},{},{},{badge: badge}]);*/
                   // $("#myLog").append("getNumberOfUnreadMessages: "+ data[0].unread + ' Endpoint: '+endpointArn);
                },
                dataType: 'json'
            });
        }
    },

    getArticles: function(artID) {
        $.mobile.loading( 'show' );
        var url = Index.site + '/moavaapi/art';
        if(artID > 0)
        {
            url += '/'+artID;
        }

        $.ajax({
            type: "POST",
            url: url,
            data: 'user=' + Index.user + '&key=' + Index.key + '&fields=' + Index.artFields + '&fieldsOff=' + Index.artFieldsOff + '&time=' + Index.appTime,
            success: function(data) {
                // console.log('Data LENGHT: ' + data.length);
                // console.log(data);
                //  $("#myLog").append('Req update '+Index.appTime+' ('+data.length+')- ');
                if(data.length > 0)
                {
                    if(artID > 0)
                    {
                        Index.listCompleteArticle(data[0]);
                    }
                    else {//list all
                        if(Index.appTime < data[0].lastUpdate) {
                            Index.listArticle(data[0]);
                            Index.listArticleList(data);
                        }
                        Index.appTime = data[0].lastUpdate;//We have now updated our app, and update last update time.
                       // $("#myLog").append('Runs update (AppTime: ' + Index.appTime + ' LastServerTime: ' + data[0].lastUpdate + ') - ');
                    }
                }
            },
            dataType: 'json'
        });



    },


    listArticle: function(art){

        var c = '';
        c += '<div style="margin:10px;padding:4px;">';
        c += '<h2>'+art.title+'</h2>';
        c += '<p style="font-size:80%;color:gray;">'+art.date+'</p>';
        c += '<p>'+art.ingress+'</p>';
        if(art.mainImg != '')
        {
            c += '<div class="" style="border: 1px solid #000000;margin-bottom: 10px;">';
            //Video?
            if(art.mainImg.type == 'video')
            {
                c += '<video width="100%" controls  poster="'+art.mainImg.vidImg+'">';
                c += '<source src="'+art.mainImg.imgUrl.medium+'" type="video/mp4">';
                c += '</video>';
            }
            else //image
            {
                c += '<img class="" style="width:100%;" src="'+art.mainImg.imgUrl.medium+'" />';
            }
            c += '<h4 style="text-align: center;">' + art.mainImg.title + '</h4>';
            if(art.mainImg.ingress != '')
            {
                c += '<p style="text-align: center;">' + art.mainImg.ingress + '</p>';
            }
            c += '</div>';

        }
        c += '<div>'+art.text+'</div>';
        c += '</div>';

        $("#contFirstArticle").html(c);
        $.mobile.loading( 'hide' );
    },


    listArticleList: function(data){
        c = '';
        c += '<ul class="ui-listview">';
        $.each(data, function(key, art){
            c += '<li class="ui-li-has-thumb">';
            c += '<a href="#dynamic" class="getContent ui-btn ui-btn-icon-right ui-icon-carat-r" data-transition="slide" data-id="'+art.id+'">';
            if(art.mainImg != '')
            {
                var imgSrc = art.mainImg.imgUrl.small;
                if(art.mainImg.type == 'video')
                {
                    imgSrc = art.mainImg.vidImg;
                }
                c += '<img src="' + imgSrc +'" />';
            }

            c += '<h2>'+art.title+'</h2>';
            c += '<p>'+art.ingress+'</p>';
            c += '</a>';
            c += '</li>';
        });


        c += '</ul>';

        $("#contArticleList").html(c);
        $.mobile.loading( 'hide' );
        $("#contArticleList .getContent").on("click", Index.showArticle);
    },



    listCompleteArticle: function(art){
        var c = '<div id="contArticle">';
        //Title and ingress
        c += '<div style="">';
        c += '<h2 class="read">'+art.title+'</h2>';
        c += '<input type="text" class="edit editText" data-texttype="title" value="'+art.title+'" style="display:none;"/>';
        c += '<p style="font-size:80%;color:gray;">'+art.date+'</p>';
        c += '<p class="read">'+art.ingress+'</p>';
        c += '<textarea class="edit editText" style="display:none;" data-texttype="ingress">'+art.ingress+'</textarea>';
        c += '</div>';
        var img = '<div id="contImg">';
        var mainImgID = '';
        if(art.mainImg != '')
        {
            c += '<div class="" style="padding:4px;">';
            //Video?
            if(art.mainImg.type == 'video')
            {
                c += '<video width="100%" controls  poster="'+art.mainImg.vidImg+'">';
                c += '<source src="'+art.mainImg.imgUrl.medium+'" type="video/mp4">';
                c += '</video>';
            }
            else //image
            {
                c += '<img class="" style="width:100%;" src="'+art.mainImg.imgUrl.medium+'" />';
            }

            c += '<h4>' + art.mainImg.title + '</h4>';
            if(art.mainImg.ingress != '')
            {
                c += '<p>' + art.mainImg.ingress + '</p>';
            }
            c += '</div>';
            c += '<p><input type="button" value="Slett ' + art.mainImg.title + '" class="btnDeleteImage button  button-block button-assertive edit" data-imageid="'+art.mainImg.id+'" style="display:none;" /></p>';
            mainImgID = art.mainImg.id;
        }

        //text
        c += '<div class="read">'+art.text+'</div>';
        c += '<textarea class="edit editText" style="display:none;" data-texttype="text">'+art.text+'</textarea>';
        c += '</div>';//end text

        //Images and videos
        $.each(art.images, function(index, oImg){
            //dont repeat mainImg
            if(oImg.id != mainImgID) {

                img += '<div style="padding:4px;">';
                //Video?
                if (oImg.type == 'video') {
                    img += '<video width="100%" controls>';
                    img += '<source src="' + oImg.imgUrl.medium + '" type="video/mp4" poster="' + oImg.vidImg + '">';
                    img += '</video>';

                }
                else //image
                {
                    img += '<img class="" style="width:100%;" src="' + oImg.imgUrl.medium + '" />';
                }
                img += '<h4>' + oImg.title + '</h4>';
                if (oImg.ingress != '') {
                    img += '<p>' + oImg.ingress + '</p>';
                }
                img += '</div>';
                img += '<p><input type="button" value="Slett ' + oImg.title + '" class="btnDeleteImage button  button-block button-assertive edit" data-imageid="'+oImg.id+'" style="display:none;" /></p>';
            }
        });
        img += '</div>';//end images


        //Files
        var f = '<div id="contFiles">';
        if(art.files.length > 0)
        {
            f = '<h4>Vedlegg</h4>';

            $.each(art.files, function(index, file){
                f += '<div class="card filesCard" data-fileurl="'+file.fileUrl+'">';
                f += '<div class="item item-divider">';
                f += file.title;
                f += '</div>';
                if(file.ingress != '')
                {
                    f += '<div class="item item-text-wrap">';
                    f += file.ingress;
                    f += '</div>';
                }
                f += '</div>';
                f += '<p><input type="button" value="Slett '+file.title+'" class="btnDeleteFile button  button-block button-assertive edit" data-fileid="'+ file.id+'" style="display:none;" /></p>';
            });

        }
        f += '</div>';
        //var end =  '<a href="'+art.url+'&APP">Les på nettsted</a>';
        var closeBtn = '<a href="#" class="ui-btn ui-icon-carat-l ui-btn-icon-left" data-rel="back">Tilbake</a>';
        /*$("#contArticle").html(c);
        $("#contImg").html(img);
        $("#contFiles").html(f);*/
        $("#contDynamic").html(c+img+f+closeBtn);
/*
        //add delete button to the end
        $("#contDeleteButton").html('<p><input type="button" id="btnDeleteArticle" value="Slett '+art.title+'" class="button  button-block button-dark edit" data-artid="'+ art.id+'" style="display:none;" /></p>');
        $(".filesCard").on("click", Show.openFile);

        //edit
        $(".editText").on("blur", Show.onEditText);
        $(".btnDeleteImage").on("click", Show.onDeleteImage);
        $(".btnDeleteFile").on("click", Show.onDeleteFile);
        $("#btnDeleteArticle").on("click", Show.onDeleteArticle);
*/
    },

    showArticle: function(e) {
        var artID = $(this).data('id');
        Index.getArticles(artID);
    },

    onSettings: function() {

    },

    onNewArticle: function() {

    }
};


var Files = {
    site: '',
    fields: '',
    appTime: '',
    fileFields: '',
    fileFieldsOff: '',
    currentSavedSettings: '',
    user: 0,
    key: '',

    init: function() {
        //$("#myLog").html("Files.init");

        if(localStorage.getItem("site"))
        {
            Files.site = localStorage.getItem('site');
        }
        if(localStorage.getItem('user'))
        {
            var userInfo = JSON.parse(localStorage.getItem("user"));
            Files.user = userInfo.id;
            Files.key = userInfo.key;
        }
        //Start with a date long time ago so we force first update
        var d = new Date(2000, 1, 1, 1, 0, 0, 0);
        Files.appTime = d.getTime();
        var setting = '';
        //do we have saved settings in local storage
        if(localStorage.getItem("file"))
        {
            setting = JSON.parse(localStorage.getItem("file"));
            Files.fileFields = JSON.stringify(setting.on);
            Files.fileFieldsOff = JSON.stringify(setting.off);
            Files.currentSavedSettings = localStorage.getItem("file");
        }
        //Not use this, as our backend is different for each user APP - Should stop this from running at all...
        /*
         Files.Articles.all().whenChanged( function (articless) {
         //Index.getArticles(0);
         //$("#myLog").append("whenChanged - ");
         });
         */

        //called every time page is get visible
            //Check if site has changed in settings - if so we empty page
            if(localStorage.getItem("site"))
            {
                if(Files.site != localStorage.getItem('site'))
                {
                    $("#contFileList").html('Dine valg gav ikke noe innhold');
                };
                //update site
                Files.site = localStorage.getItem('site');
            }
            //we update if local storage has changed
            if(localStorage.getItem("file") && localStorage.getItem("file") != Files.currentSavedSettings)
            {
                //reload with new settings
                setting = JSON.parse(localStorage.getItem("file"));
                Files.fileFields = JSON.stringify(setting.on);
                Files.fileFieldsOff = JSON.stringify(setting.off);
                //Set time back again to force update
                Files.appTime = d.getTime();
                Files.currentSavedSettings = localStorage.getItem("file");
                Files.getFiles();
            }
            else
            {
                //We just check for updates
                $( document ).ready(function() {
                    //check if settings is set - can have been deleted when selecting site
                    if(!localStorage.getItem('file'))
                    {
                        Files.fileFields = '';//empty fields
                        Files.fileFieldsOff = '';//empty fields
                        Files.currentSavedSettings = '';//empty settings
                        Files.appTime = d.getTime();
                    }
                    Files.getFiles();
                });

            }


       


    },

    getFiles: function() {
        $.mobile.loading( 'show' );
       // $("#myLog").append('REQUEST: user=' + Files.user + '&key=' + Files.key + '&fields=' + Files.fileFields + '&fieldsOff=' + Files.fileFieldsOff + '&time=' + Files.appTime);
        $.ajax({
            type: "POST",
            url: Files.site + '/moavaapi/file',
            data:  'user=' + Files.user + '&key=' + Files.key + '&fields=' + Files.fileFields + '&fieldsOff=' + Files.fileFieldsOff + '&time=' + Files.appTime,
            success: function(data) {
              //  $("#myLog").append('Info lastUpdate: ' + data.info.lastUpdate);
                console.log('FILE DATA:');
                console.log(data.content);
             //   $("#myLog").append(data.content[0].fieldTitle);
             //   $("#myLog").append('Req update '+Files.appTime+' ('+data.content.length+') - ');
                if(data.content.length > 0)
                {
                    if(Files.appTime < data.info.lastUpdate) Files.listFileList(data.content);
                    Files.appTime = data.info.lastUpdate;//We have now updated our app, and update last update time.

                    //console.log('Runs update (' + Files.appTime + ' ' + data.info.lastUpdate + ') - ');
                  //  $("#myLog").append('Runs update (AppTime: ' + Files.appTime + ' LastServerTime: ' + data.info.lastUpdate + ') - ');
                }
            },
            dataType: 'json'
        });

    },

    listFileList: function(data){
        var c = '<div id="fileList" data-content-theme="a" data-theme="a" data-role="collapsibleset" >';
        //Field title
        $.each(data, function(fieldIndex, field){
            c += '<div data-role="collapsible"><h3>'+field.fieldTitle+'</h3>';



           // c += '<h3>' + field.fieldTitle + '</h3>';
            //c += '<div style="margin:0;padding:0;">';
            c += '<p style="padding:0;">';
                c += '<ul style="margin:0;padding:0;">';
                $.each(data[fieldIndex].files, function(key, file){
                    c += '<li class="fileUrl ui-btn ui-btn-icon-right ui-icon-carat-r" data-fileurl="' + file.url + '">';
                    c += '<span>'+file.title+'</span>';
                    c += '</li>';
                });
                c += '</ul>';
            c += '</p>';
            c += '</div>';
        });
        c += '</div>';
        $("#contFileList").html(c);
        $.mobile.loading( 'hide' );
        $("#fileList").collapsibleset();



        $(".fileUrl").on("click", Files.onFile);
    },

    onFile: function(e) {
        $.mobile.loading( 'show' );
        var fileUrl = $(this).data('fileurl');
        var ext = fileUrl.split('.').pop();
        //open pdf and images in in ap browser - else in browser
        if(ext == 'jpg' || ext == 'png') {
            $.mobile.loading( 'hide' );
            var ref = cordova.InAppBrowser.open(fileUrl, '_blank', 'location=no,closebuttoncaption=Lukk,enableViewportScale=yes');//_blank, _system
        }
        else {
            $.mobile.loading( 'hide' );
            window.open(fileUrl, '_system');
        }
    }
};


//Info -------------------

var Info = {

    init: function() {

            Info.getNumberOfUnreadMessages(0);
            Info.getMessages();
            Info.getArticle();

            //Remove badge
            // supersonic.ui.tabs.update([{},{},{},{badge: ""}]);




        /*
         var pushNotification;
         document.addEventListener("deviceready", function() {
         pushNotification = window.plugins.pushNotification;

         // the result contains any error description text returned from the plugin call
         function errorHandler(error) {
         alert('error = ' + error);
         }

         //Messages while app is open
         function messageInForegroundHandler(notification) {
         var notificationMessage = '';
         if (notification.message) {
         notificationMessage = notification.message;
         }
         if (notification.alert) {
         notificationMessage = notification.alert;
         }
         //handle the contents of the notification
         steroids.logger.log('message in Info tab: ' + notificationMessage);

         var d = new Date();
         $("#containerMessages").prepend('<p>' + d.getTime() + ' Ny melding: ' + notificationMessage + '</p>');
         //Remove badge
         supersonic.ui.tabs.update([{},{},{},{badge: ""}]);
         /* $("#myLog").append('<p>PushMsg: ' + notificationMessage + '</p>');
         $("#myLog").append('<p>Sound: ' + notification.sound + '</p>');
         $("#myLog").append('<p>Badge: ' + notification.badge + '</p>');*/
        /*
         if (notification.sound) {
         var snd = new Media(notification.sound);
         snd.play();
         }

         if (notification.badge) {
         pushNotification.setApplicationIconBadgeNumber(function () {
         }, function () {
         }, notification.badge);
         }

         }

         pushNotification.onMessageInForeground(
         messageInForegroundHandler,
         errorHandler);
         });

         */
    },

    findUrlsInText: function(text) {
        var urls = text.match(/(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)|((mailto:)?[_.\w-]+@([\w][\w\-]+\.)+[a-zA-Z]{2,3})/g);
        if(urls) {
            text = text.replace(/&amp;/g, '&');
            //var urls = text.match(/\b(http|https)?(:\/\/)?(\S*)\.(\w{2,4})\b/ig);


            for (var i = 0, il = urls.length; i < il; i++) {
                //Check if urls contain http
                var url = urls[i];
                if (!urls[i].match(/http/) && !urls[i].match(/mailto/)) url = 'http://' + urls[i];
                //replace links with a-tags
                text = text.replace(urls[i], '<a href="' + url + '">' + urls[i] + '</a>');
            }
        }
        return text;
    },

    getMessages: function() {
        $.mobile.loading( 'show' );
        var fields = '';
        /*
         if(localStorage.getItem("art") && localStorage.getItem("art") != Index.currentSavedSettings) {
         //reload with new settings
         setting = JSON.parse(localStorage.getItem("art"));
         Index.artFields = JSON.stringify(setting.on);
         Index.artFieldsOff = JSON.stringify(setting.off);
         }
         */

        var fields = new Array();
        var fieldsOff = '';
        var setting;

        if(localStorage.getItem("art"))
        {

            //reload with new settings
            setting = JSON.parse(localStorage.getItem("art"));
            var fieldsArt = setting.on;
            fieldsOff += JSON.stringify(setting.off);
            for(var i=0;i<fieldsArt.length;i++)
            {
                fields.push(fieldsArt[i]);
            }
        }
        if(localStorage.getItem("cal"))
        {
            //reload with new settings
            setting = JSON.parse(localStorage.getItem("cal"));
            var fieldsCal = setting.on;
            fieldsOff += JSON.stringify(setting.off);
            for(var i=0;i<fieldsArt.length;i++)
            {
                fields.push(fieldsCal[i]);
            }
        }
        if(localStorage.getItem("file"))
        {
            //reload with new settings
            setting = JSON.parse(localStorage.getItem("file"));
            var  fieldsCal = setting.on;
            fieldsOff += JSON.stringify(setting.off);
            for(var i=0;i<fieldsCal.length;i++)
            {
                fields.push(fieldsCal[i]);
            }
        }
        var allFields = JSON.stringify(fields);

        //localStorage.setItem("endpointArn", 'arn:aws:sns:us-west-2:976398037860:endpoint/APNS_SANDBOX/PhonegapMinMoava/a53b197f-18cf-328c-a1ab-d01fdce3a9ca');

        if(localStorage.getItem("endpointArn")) {

            var endpointArn = localStorage.getItem("endpointArn");
            endpointArn = 'arn:aws:sns:us-west-2:976398037860:endpoint/APNS_SANDBOX/PhonegapMinMoava/fb03b679-3a3b-38a3-aee0-9a5437f5f091';//testing
            $.ajax({
                type: "POST",
                url: localStorage.getItem('site') + '/moavaapi/getpushmsg',
                data: 'endpointArn='+endpointArn+'&fields='+allFields,
                success: function (data) {
                    Info.listMessages(data);
                },
                fail: function(response) {
                     alert("Fail "+ response);
                },
                dataType: 'json'
            });
        }
        else
        {
            var data = {};
            Info.listMessages(data);
        }
    },

    listMessages: function(data) {
       /*
        'msgID' => $row->pushmsg_id,
            'msg' => $row->pushmsg_txt,
            'date' => $row->pushmsg_date,
            'what' => $row->pushmsg_what,//cal, art, file, txt
            'whatID' => $row->pushmsg_whatID,
            'fileUrl' => $row->pushmsg_url*/

        //test data
        /*
       var data = [{"msg":
       {
           "msg":"Ny artikkel: Fotballkamp og masse tekst her så må sjekke om det blir plass til alt eller hvordan nå dette fungerer. <br>Ny artikkel: Fotballkamp og masse tekst her så må sjekke om det blir plass til alt eller hvordan nå dette fungererNy artikkel: Fotballkamp og masse tekst her så må sjekke om det blir plass til alt eller hvordan nå dette fungerer",
           "date":"1.1.2016",
           "msgID": '1',
           "what": 'art',
           "whatID": '372',
           "fileUrl": 'http://nrk.no'
       }},
           {"msg":
           {
               "msg":"Ny kalenderhendels: Varbergmarsjen",
               "date":"2.2.2016",
               "msgID": '2',
               "what": 'cal',
               "whatID": '53',
               "fileUrl": 'http://vg.no'
           }}];
*/
        //alert("List messages"+data.msg[1].msg);
        var c = '<h3>Meldinger</h3>';


       // c += '<ul class="ui-listview" data-role="listview">';
        $.each(data, function(key, message)
        {
            var what = message.msg.what;
                c += '<div class="ui-body ui-body-a ui-corner-all" style="margin-bottom:6px;">';
            if(what == 'cal' || what == 'art' || what == 'file') c += '<a href="#dynamic" class="get'+what+' ui-btn ui-btn-icon-right ui-icon-carat-r" data-transition="slide" data-id="'+message.msg.whatID+'" data-fileurl="'+message.msg.fileUrl+'" style="text-align:left;background-color:#FFFFFF;border:none;">';
                c += '<h5 class="ui-bar ui-bar-a ui-corner-all">'+message.msg.title+'</h5>';
                c += '<p>';
                c += Info.findUrlsInText(message.msg.msg);
                c += ' <span style="color:lightslategray;text-align:right;font-size: 80%;float:right;">'+message.msg.date+'</span>';
                c += '</p>';
            if(what == 'cal' || what == 'art' || what == 'file')  c += '</a>';
                c += '</div>';

            /*
            c += '<li class="ui-field-contain ui-body ui-br ui-li ui-li-static ui-btn-up-c" data-role="fieldcontain">';
            c += '<label class="ui-btn-text contMsg" data-id="'+message.msg.whatID+'">'+message.msg.msg+' '+message.msg.msgID+' '+message.msg.what+' '+message.msg.whatID+' '+message.msg.fileUrl;
            c += ' <span style="color:lightslategray;text-align:right;font-size: 80%;float:right;">'+message.msg.date+'</span></label>';
            c += '</li>';
            */
        });
       // c += '</ul><br>';

        if(data.length) {
            c += '<div><button class="ui-btn removeMsg">Ok, meldingene er lest</button></div>';
        }
        $("#contMessages").html(c);
        $.mobile.loading( 'hide' );

        //listeners to what-elements like art, file, cal
        $(".getcal").on("click", function(e) {
            var eventID = $(this).data('id');
            Cal.getEvents(eventID);

        });
        $(".getart").on("click", function(e) {
            var artID = $(this).data('id');
            Index.getArticles(artID);

        });
        $(".getfile").on("click", Files.onFile);

        //Remove msg - set as read
        $(".removeMsg").on("click", Info.resetUnreadMsg);


    },

    /**
     * We can call this when getting a push while inside app
     * Or call anytime with badgeFromPush = 0 - It will then ask server for unread messages
     * @param badgeFromPush
     */
    getNumberOfUnreadMessages: function(badgeFromPush) {
        if(badgeFromPush > 0)
        {
            $(".badge").html(badgeFromPush);
            $(".badge").css("display", "block");
            if( window.isphone ) { cordova.plugins.notification.badge.set(badgeFromPush)};
        }
        else {
            //  $("#myLog").append("unread??");
            if (localStorage.getItem("endpointArn")) {
                var endpointArn = localStorage.getItem("endpointArn");
                $.ajax({
                    type: "POST",
                    url: localStorage.getItem('site') + '/moavaapi/getNumberOfUnreadMessages/',
                    data: 'endpointArn=' + endpointArn,
                    success: function (data) {

                        var badgeNumber = data[0].unread;
                        var badge = badgeNumber.toString();
                        $(".badge").html(badge);
                        if (badge > 0) {
                            $(".badge").css("display", "block");
                        }
                        else {
                            $(".badge").css("display", "none");
                        }
                        //Set badge on icon
                        if( window.isphone ) { cordova.plugins.notification.badge.set(badge)}; //Does not work!! Everything stops...
                        /*cordova.plugins.notification.badge.hasPermission(function (granted) {
                         console.log('Permission has been granted: ' + granted);
                         });*/

                    //    $("#myLog").append("getNumberOfUnreadMessages: " + data[0].unread + ' Endpoint: ' + endpointArn);
                    },
                    fail: function () {

                    },
                    dataType: 'json'
                });
            }
        }
    },

    /**
     * Set unread messages to 0
     */
    resetUnreadMsg: function(e) {
        $.mobile.loading( 'show' );
        if(localStorage.getItem("endpointArn")) {

            var endpointArn = localStorage.getItem("endpointArn");
            $.ajax({
                type: "POST",
                url: localStorage.getItem('site') + '/moavaapi/resetunreadpush/',
                data: 'endpointArn='+endpointArn,
                success: function (data) {
                    $.mobile.loading( 'hide' );
                    if( window.isphone ) { cordova.plugins.notification.badge.set(0)};
                    $(".badge").html('');
                    $(".badge").css("display", "none");
                    Info.getMessages();
                    $.mobile.loading( 'hide' );
                },
                dataType: 'json'
            });
        }
    },

    getArticle: function() {
        $.mobile.loading( 'show' );
        $.ajax({
            type: "POST",
            url: localStorage.getItem('site') + '/moavaapi/info',
            success: function(data) {
                Info.listArticle(data[0]);

            },
            dataType: 'json'
        });
    },

    listArticle: function(art){

        var c = '';
        //Title and ingress
        c += '<div>';
        c += '<h2 class="read">'+art.title+'</h2>';
       // c += '<input type="text" class="edit editText" data-texttype="title" value="'+art.title+'" style="display:none;"/>';
        c += '<p style="font-size:80%;color:gray;">'+art.date+'</p>';
        c += '<p class="read">'+art.ingress+'</p>';
       // c += '<textarea class="edit editText" style="display:none;" data-texttype="ingress">'+art.ingress+'</textarea>';
        c += '</div>';
        var img = '';
        var mainImgID = '';
        if(art.mainImg != '')
        {
            c += '<div class="" style="padding:4px;">';
            //Video?
            if(art.mainImg.type == 'video')
            {
                c += '<video width="100%" controls  poster="'+art.mainImg.vidImg+'">';
                c += '<source src="'+art.mainImg.imgUrl.medium+'" type="video/mp4">';
                c += '</video>';
            }
            else //image
            {
                c += '<img class="" style="width:100%;" src="'+art.mainImg.imgUrl.medium+'" />';
            }

            c += '<h4>' + art.mainImg.title + '</h4>';
            if(art.mainImg.ingress != '')
            {
                c += '<p>' + art.mainImg.ingress + '</p>';
            }
            c += '</div>';
          // c += '<p><input type="button" value="Slett ' + art.mainImg.title + '" class="btnDeleteImage button  button-block button-assertive edit" data-imageid="'+art.mainImg.id+'" style="display:none;" /></p>';
            mainImgID = art.mainImg.id;
        }

        //text
        c += '<div class="read">'+art.text+'</div>';
        c += '<textarea class="edit editText" style="display:none;" data-texttype="text">'+art.text+'</textarea>';
        //Images and videos
        $.each(art.images, function(index, oImg){
            //dont repeat mainImg
            if(oImg.id != mainImgID) {

                img += '<div style="padding:4px;">';
                //Video?
                if (oImg.type == 'video') {
                    img += '<video width="100%" controls>';
                    img += '<source src="' + oImg.imgUrl.medium + '" type="video/mp4" poster="' + oImg.vidImg + '">';
                    img += '</video>';

                }
                else //image
                {
                    img += '<img class="" style="width:100%;" src="' + oImg.imgUrl.medium + '" />';
                }
                img += '<h4>' + oImg.title + '</h4>';
                if (oImg.ingress != '') {
                    img += '<p>' + oImg.ingress + '</p>';
                }
                img += '</div>';
              //  img += '<p><input type="button" value="Slett ' + oImg.title + '" class="btnDeleteImage button  button-block button-assertive edit" data-imageid="'+oImg.id+'" style="display:none;" /></p>';
            }
        });

        //Files
        var f = '';
        if(art.files.length > 0)
        {
            f = '<h4>Vedlegg</h4>';

            $.each(art.files, function(index, file){
                f += '<div class="card filesCard" data-fileurl="'+file.fileUrl+'">';
                f += '<div class="item item-divider">';
                f += file.title;
                f += '</div>';
                if(file.ingress != '')
                {
                    f += '<div class="item item-text-wrap">';
                    f += file.ingress;
                    f += '</div>';
                }
                f += '</div>';
             //   f += '<p><input type="button" value="Slett '+file.title+'" class="btnDeleteFile button  button-block button-assertive edit" data-fileid="'+ file.id+'" style="display:none;" /></p>';
            });

        }

        c += '<a href="'+art.url+'&APP">Les på nettsted</a>';
        $.mobile.loading( 'hide' );
        $("#contArticle").html(c);
        $("#contImg").html(img);
        $("#contFiles").html(f);

        //add delete button to the end
        $("#contDeleteButton").html('<p><input type="button" id="btnDeleteArticle" value="Slett '+art.title+'" class="button  button-block button-dark edit" data-artid="'+ art.id+'" style="display:none;" /></p>');
        $(".filesCard").on("click", Files.onFile);



    }

};








//PUSH-------------------

var Push = {

    setupPush: function() {

        var push = PushNotification.init({
            "android": {
                "senderID": "742481540214"
            },
            "ios": {
                "sound": true,
                "vibration": true,
                "badge": true
            },
            "windows": {}
        });


        /**
         * Register device registartion ID
         * data.registrationId
         */
        push.on('registration', function(data) {

            if(localStorage.getItem('registrationId'))  localStorage.removeItem('registrationId');

            localStorage.setItem('registrationId', data.registrationId);

            //Settings.setPushSettings('', 0);





        });

        push.on('error', function(e) {
            console.log("push error = " + e.message);
        });

        /**
         * Called when inside App
         * data.message, data.count, data.sound
         */
        push.on('notification', function(data) {

            //Show badge-number on tab Info
            Info.getNumberOfUnreadMessages(data.count);
            //update messages
            Info.getMessages();
            //play sound
            //navigator.notification.beep(1);

            //Play push message sound
            var myMedia = new Media("moavapushsound.wav");
            myMedia.play();

            //Show message - Maybe
            /*
            navigator.notification.alert(
                data.message,         // message
                null,                 // callback
                data.title,           // title
                'Ok'                  // buttonName
            );
*/
            var message = Info.findUrlsInText(data.message);

            $("#messageContent").html(message);
            $.mobile.changePage('#dialogMessages');



        });
    }

};




//Register Push Notifications
PushOLD = {

    initRegistration: function() {

        var pushNotification;
        document.addEventListener("deviceready", function() {
            pushNotification = window.plugins.pushNotification;

            // the result contains any error description text returned from the plugin call
            function errorHandler (error) {
                alert('error = ' + error);
            }

            //Register a new device
            function registrationHandler (deviceToken) {
                console.log('deviceToken = ' + deviceToken);
                //save the deviceToken / registration ID to your Push Notification Server
                var currentEndpointArn = '';
                if(localStorage.getItem('endpointArn'))
                {
                    currentEndpointArn = localStorage.getItem('endpointArn');
                    //localStorage.removeItem('endpointArn');
                }
                //get all fields
                var fields = '';
                $(".chbSetting").each(function(index, setting){
                    if($(setting).is(':checked'))
                    {
                        fields += '&fields[]=' + $(setting).val();
                    }
                });
                //Are we logged in?
                var user = 0;
                if(localStorage.getItem('user'))
                {
                    user = localStorage.getItem('user');
                }
                $.ajax({
                    type: "POST",
                    url: Settings.site + '/moavaapi/pushregister/' + deviceToken,
                    data: 'endpointArn=' + currentEndpointArn + fields + '&user=' + user,
                    success: function(data) {
                        if(localStorage.getItem('endpointArn'))
                        {
                            localStorage.removeItem('endpointArn');

                        }
                        localStorage.setItem('endpointArn', data[0].endpointArn);
                        console.log(data);
                        console.log('Mottat endpointArn: ' + data[0].endpointArn);
                    },
                    dataType: 'json'
                });
            }

            pushNotification.register(
                registrationHandler,
                errorHandler, {
                    //android options
                    "senderID":"1234567891011",
                    //ios options
                    "badge":"true",
                    "sound":"true",
                    "alert":"true"
                });
        });


        /*
         //Messages while app is
         function messageInForegroundHandler (notification) {
         var notificationMessage = '';
         if(notification.message)
         {
         notificationMessage = notification.message;
         }
         if(notification.alert)
         {
         notificationMessage = notification.alert;
         }
         //handle the contents of the notification
         console.log('messageInForegroundHandler: ' + notificationMessage);

         //Show messages alert
         var options = {
         message: notificationMessage,
         buttonLabel: "Lukk"
         };

         supersonic.ui.dialog.alert("Ny melding!", options).then(function() {
         supersonic.logger.log("Alert closed.");
         });

         $("#containerMessages").append('<p>Ny melding: ' + notificationMessage + '</p>');
         $("#myLog").append('<p>PushMsg: ' + notificationMessage + '</p>');
         $("#myLog").append('<p>Sound: ' + notification.sound + '</p>');
         $("#myLog").append('<p>Badge: ' + notification.badge + '</p>');


         if ( notification.sound ) {
         var snd = new Media(notification.sound);
         snd.play();
         }

         if ( notification.badge ) {
         pushNotification.setApplicationIconBadgeNumber(function(){}, function(){}, notification.badge);
         }
         }

         pushNotification.onMessageInForeground(
         messageInForegroundHandler,
         errorHandler);

         */


        /*
         //Messages while app is closed
         function errorHandler (error) {
         alert('error = ' + error);
         }

         function messageInBackgroundHandler (notification) {
         if (notification.coldstart) {
         // ios, this is always true
         // the application was started by the user tapping on the notification
         }
         else {
         //this notification was delived while the app was in background
         }

         //handle the contents of the notification
         var message = notification.message || notification.alert;
         alert(message);

         }

         pushNotification.onMessageInBackground(
         messageInBackgroundHandler,
         errorHandler);

         */


    }


};
