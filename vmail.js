Recordings = new Meteor.Collection("recordings");


if (Meteor.isClient) {
  Template.messages.greeting = function () {
    return "Welcome to vmail.";
  };

  Template.messages.recordings = function() {
    return Recordings.find({}, {sort:{date_started:-1}});
  };

  Template.messages.complete = function() {
    return this.status == 'Complete';
  }

  Template.messages.events({
    'click input' : function () {
      // template data, if any, is available in 'this'
      if (typeof console !== 'undefined')
        console.log("You pressed the button");
    }
  });
}


if (Meteor.isServer) {
  Twilio = Meteor.require('twilio')('AC520d05ec666b6328985a0e9e16e6aaf6', 'f92e899549ba6108658560e933d0a2d6');

  Meteor.startup(function () {
  });

}

Router.configure();
Router.map(function(){
  this.route("incoming", {
    path: '/incoming',
    where: 'server',
    action: function() {
      var recording = {
        'call_sid': this.params.CallSid,
        'call_from': this.params.From,
        'date_started': new Date(),
        'duration': 0,
        'uri': null,
        'status': "Recording"
      };

      Recordings.insert(recording);

      this.response.writeHead(200, {'Content-Type': 'text/xml'});
      this.response.end('<?xml version="1.0" encoding="UTF-8"?>\
        <Response><Say voice="woman">Please leave a message after the tone.</Say>\
        <Record maxLength="20" action="recording_done" method="GET" />\
        <Redirect method="GET">recording_cancel</Redirect></Response>');
    }
  });
  this.route("recording_done", {
    path: '/recording_done',
    where: 'server',
    action: function() {
      var recording = Recordings.findOne({'call_sid': this.params.CallSid});
      recording.date_finished = new Date();
      recording.duration = this.params.RecordingDuration;
      recording.uri = this.params.RecordingUrl;
      recording.recording_sid = this.params.RecordingSid;
      recording.status = "Complete";

      Recordings.update(recording._id, recording);

      this.response.writeHead(200, {'Content-Type': 'text/xml'});
      this.response.end('<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>');
    }
  });
  this.route("recording_cancel", {
    path: '/recording_cancel',
    where: 'server',
    action: function() {
      var recording = Recordings.findOne({'call_sid': this.params.CallSid});
      recording.date_finished = new Date();
      recording.duration = 0;
      recording.status = "Cancelled";

      Recordings.update(recording._id, recording);

      this.response.writeHead(200, {'Content-Type': 'text/xml'});
      this.response.end('<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>');
    }
  });
});
