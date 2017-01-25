/*
To create tables
curl -X POST -H "X-Parse-Application-Id: oMfjTN2eLGpB6EErOGuNecyvQspSnd5cIOaQNXYy" -H "X-Parse-REST-API-Key: x3tO7rjAp9ChPjJvyh3e7uTWIm5dffdTdAoT3uHT" -H "Content-Type: application/json" -d '{"userId" : "XE3BVNZoBh"}' https://api.parse.com/1/functions/deleteUser
curl -X POST -H "X-Parse-Application-Id: oMfjTN2eLGpB6EErOGuNecyvQspSnd5cIOaQNXYy" -H "X-Parse-REST-API-Key: x3tO7rjAp9ChPjJvyh3e7uTWIm5dffdTdAoT3uHT" -H "Content-Type: application/json" -d '{"userId" : "tCrkkXzMFP", "country" : ["USA"], "degree" : "Undergraduate", "major" : "engineeringAndTechnology"}' https://api.parse.com/1/functions/getShortlist
*/

var isProduction = false;

/* Publish message to pubnub*/
if(isProduction) {
    var pubnub = {
                'publish_key'   : 'pub-c-fd12ea0a-dad9-43b2-ba31-c934ec0d9750',
                'subscribe_key' : 'sub-c-33fa51d2-2c7c-11e5-8bfc-02ee2ddab7fe'
            };
} else {  /*staging*/
    var pubnub = {
                'publish_key'   : 'pub-c-e20d99c7-8154-4ce5-a899-397b73ec6ba7',
                'subscribe_key' : 'sub-c-d073be10-63de-11e5-bba9-02ee2ddab7fe'
            };
}



var sendgrid = require("sendgrid")('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');
//sendgrid.initialize("app6274082@heroku.com", "qfb1jdbh2509");

var Image = require("parse-image");

Parse.Cloud.define("getShortlist", function(request, response) {
    var userId = request.params.userId;
    var country = request.params.country;
    var degree = request.params.degree;
    var major = request.params.major;

    helloPromise().then(
        function(results) {
            response.success("University shortlist updated");
        }, function(error) {
            response.error("Failed to update shortlist "  + error.code + ":" + error.message);
        }
    );

    response.success("University shortlist end");

});

function helloPromise() {
    return new Parse.Promise(function (resolve, reject) {
        var randomnumber = Math.floor(Math.random() * (10 - 1 + 1)) + 1;

        if(randomnumber < 5) {
            Parse.Promise.resolve("helloPromise: resolved");
        } else {
            Parse.Promise.reject("helloPromise: reject");
        }
        window.setTimeout(
                        function() {
                            // We fulfill the promise !
                            resolve("helloPromise: resolved");
                        }, Math.random() * 2000 + 1000);

    });
}

Parse.Cloud.define("getShortlist1", function(request, response) {
    var userId = request.params.userId;
    var country = request.params.country;
    var degree = request.params.degree;
    var major = request.params.major;

    var user = Parse.Object.extend("_User").createWithoutData(userId);

    /* Only for undergraduate shortlist */

    var query = new Parse.Query("University");
    query.equalTo("country", country[0]);

    switch(country[0]) {
        case "USA":
            switch(major) {
                    case "Engineering and Technology":
                        query.equalTo("engineeringAndTechnology", true);
                        break;
                    case "Business and Economics":
                        query.equalTo("businessAndEconomics", true);
                        break;
                    default:
                        /* don't consider major as a factor */
            }
            query.greaterThan("acceptanceRate", 0);
            query.ascending("acceptanceRate");
            break;
        default:
            query.greaterThan("ranking", 0);
            query.ascending("ranking");
    }

    query.limit(1000);

    query.find({
        success: function(universities) {

            var reachUniversitiesTotal = [];
            var matchUniversitiesTotal = [];
            var safeUniversitiesTotal = [];

            switch(country[0]) {
                case "USA":
                    for(var i = 0; i < universities.length; i++) {
                        if(universities[i].get("acceptanceRate") <= 25) {
                            reachUniversitiesTotal[reachUniversitiesTotal.length] = universities[i];
                        } else if(universities[i].get("acceptanceRate") > 60) {
                            safeUniversitiesTotal[safeUniversitiesTotal.length] = universities[i];
                        } else {
                            matchUniversitiesTotal[matchUniversitiesTotal.length] = universities[i];
                        }
                    }
                    break;
                case "Australia":
                    for(var i = 0; i < universities.length; i++) {
                        if(universities[i].get("ranking") <= 10) {
                            reachUniversitiesTotal[reachUniversitiesTotal.length] = universities[i];
                        } else if(universities[i].get("ranking") > 10 && universities[i].get("ranking") <= 25) {
                            matchUniversitiesTotal[matchUniversitiesTotal.length] = universities[i];
                        } else {
                            safeUniversitiesTotal[safeUniversitiesTotal.length] = universities[i];
                        }
                    }
                    break;
                case "Germany":
                    for(var i = 0; i < universities.length; i++) {
                        if(universities[i].get("ranking") <= 25) {
                            reachUniversitiesTotal[reachUniversitiesTotal.length] = universities[i];
                        } else if(universities[i].get("ranking") > 25 && universities[i].get("ranking") <= 40) {
                            matchUniversitiesTotal[matchUniversitiesTotal.length] = universities[i];
                        } else {
                            safeUniversitiesTotal[safeUniversitiesTotal.length] = universities[i];
                        }
                    }
                    break;
                default:
            }

            /* Randomize listing */
            reachUniversitiesTotal.sort( function() { return 0.5 - Math.random() } );
            matchUniversitiesTotal.sort( function() { return 0.5 - Math.random() } );
            safeUniversitiesTotal.sort( function() { return 0.5 - Math.random() } );

            var reachUniversities = reachUniversitiesTotal.splice(0, 3);
            var matchUniversities = matchUniversitiesTotal.splice(0, 3);
            var safeUniversities = safeUniversitiesTotal.splice(0, 3);

            var newShortlists = [];

            var j = 0;
            for(var i = 0; i < reachUniversities.length; i++) {
                var userUniversity = new Parse.Object("UserUniversity");
                userUniversity.set({
                                    user: user,
                                    university: reachUniversities[i],
                                    type: "reach",
                                    recommendationBy: "Ana"

                });
                newShortlists[j] = userUniversity;
                j++;
            }

            for(var i = 0; i < matchUniversities.length; i++) {
                var userUniversity = new Parse.Object("UserUniversity");
                userUniversity.set({
                                    user: user,
                                    university: matchUniversities[i],
                                    type: "match",
                                    recommendationBy: "Ana"

                });
                newShortlists[j] = userUniversity;
                j++;
            }

            for(var i = 0; i < safeUniversities.length; i++) {
                var userUniversity = new Parse.Object("UserUniversity");
                userUniversity.set({
                                    user: user,
                                    university: safeUniversities[i],
                                    type: "safe",
                                    recommendationBy: "Ana"

                });
                newShortlists[j] = userUniversity;
                j++;
            }

            var universityId = safeUniversities[0].id;

            /* Delete old shortlists from UserUniversity table
             * Insert new shortlists to UserUniversity table
             */
            var UserUniversity = Parse.Object.extend("UserUniversity");
            var deleteOldShortlistQuery = new Parse.Query(UserUniversity);
            deleteOldShortlistQuery.equalTo("user", user);
            deleteOldShortlistQuery.find().then(
                function(oldShortlists) {
                    Parse.Object.destroyAll(oldShortlists);

                    Parse.Object.saveAll(newShortlists).then(
                        function(results) {
                            response.success("Deleted old shortlists # " + oldShortlists.length + " Created new shortlists #" + newShortlists.length);
                        }
                    );
                }
            );


            /* Update reco status */

            /* Send alerts */ 




            //response.success("Got shortlisted universities for " + major + " " + userUniversities.length + " : Shortlist " + universityId);

        },
        error: function(error) {
            response.error("Failed to get shortlisted universities: " + error.code + ":" + error.message);
        }
    });

    /*
    var cluster = Parse.Object.extend("Cluster").createWithoutData("iNEBTypoLD");

    var query = new Parse.Query("ClusterUniversity");
    query.equalTo("cluster", cluster);
    query.include("cluster");

    query.first({
        success: function(clusterUniversity) {
            if(clusterUniversity) {
                var clusterObj = clusterUniversity.get("cluster");
                var universityObjs = clusterUniversity.get("universities");

                var universityNames = "";
                var universities = [];
                for(var i = 0; i < universityObjs.length; i++) {
                    universities[i] = universityObjs[i].id;
                    universityNames += universities[i] + ",";
                }

                response.success("Got cluster: " + clusterUniversity.id + ":" + clusterObj.get("cluster") + ":" + universityNames);
            } else {
                response.success("Where is cluster?");
            }

        },
        error: function(error) {
            response.error("Failed to get inactive users: " + error.code + ":" + error.message);
        }
    });
    */
});

function getShortlistUG(userId, country, degree, major) {

    return new Parse.Promise(function(resolve, reject) {
        var user = Parse.Object.extend("_User").createWithoutData(userId);

        var findUniversityQuery = new Parse.Query("University");
        findUniversityQuery.equalTo("country", country);

        switch(country) {
            case "USA":
                switch(major) {
                        case "Engineering and Technology":
                            findUniversityQuery.equalTo("engineeringAndTechnology", true);
                            break;
                        case "Business and Economics":
                            findUniversityQuery.equalTo("businessAndEconomics", true);
                            break;
                        default:
                            /* don't consider major as a factor */
                }
                findUniversityQuery.greaterThan("acceptanceRate", 0);
                findUniversityQuery.ascending("acceptanceRate");
                break;
            default:
                findUniversityQuery.greaterThan("ranking", 0);
                findUniversityQuery.ascending("ranking");
        }

        findUniversityQuery.limit(1000);

        findUniversityQuery.find().then(
            function(universities) {
                var reachUniversitiesTotal = [];
                var matchUniversitiesTotal = [];
                var safeUniversitiesTotal = [];

                switch(country[0]) {
                    case "USA":
                       for(var i = 0; i < universities.length; i++) {
                           if(universities[i].get("acceptanceRate") <= 25) {
                               reachUniversitiesTotal[reachUniversitiesTotal.length] = universities[i];
                           } else if(universities[i].get("acceptanceRate") > 60) {
                               safeUniversitiesTotal[safeUniversitiesTotal.length] = universities[i];
                           } else {
                               matchUniversitiesTotal[matchUniversitiesTotal.length] = universities[i];
                           }
                       }
                       break;
                    case "Australia":
                       for(var i = 0; i < universities.length; i++) {
                           if(universities[i].get("ranking") <= 10) {
                               reachUniversitiesTotal[reachUniversitiesTotal.length] = universities[i];
                           } else if(universities[i].get("ranking") > 10 && universities[i].get("ranking") <= 25) {
                               matchUniversitiesTotal[matchUniversitiesTotal.length] = universities[i];
                           } else {
                               safeUniversitiesTotal[safeUniversitiesTotal.length] = universities[i];
                           }
                       }
                       break;
                    case "Germany":
                       for(var i = 0; i < universities.length; i++) {
                           if(universities[i].get("ranking") <= 25) {
                               reachUniversitiesTotal[reachUniversitiesTotal.length] = universities[i];
                           } else if(universities[i].get("ranking") > 25 && universities[i].get("ranking") <= 40) {
                               matchUniversitiesTotal[matchUniversitiesTotal.length] = universities[i];
                           } else {
                               safeUniversitiesTotal[safeUniversitiesTotal.length] = universities[i];
                           }
                       }
                       break;
                    default:
                }

                /* Randomize listing */
                reachUniversitiesTotal.sort( function() { return 0.5 - Math.random() } );
                matchUniversitiesTotal.sort( function() { return 0.5 - Math.random() } );
                safeUniversitiesTotal.sort( function() { return 0.5 - Math.random() } );

                var reachUniversities = reachUniversitiesTotal.splice(0, 3);
                var matchUniversities = matchUniversitiesTotal.splice(0, 3);
                var safeUniversities = safeUniversitiesTotal.splice(0, 3);

                var newShortlists = [];

                var j = 0;
                for(var i = 0; i < reachUniversities.length; i++) {
                   var userUniversity = new Parse.Object("UserUniversity");
                   userUniversity.set({
                                       user: user,
                                       university: reachUniversities[i],
                                       type: "reach",
                                       recommendationBy: "Ana"

                   });
                   newShortlists[j] = userUniversity;
                   j++;
                }

                for(var i = 0; i < matchUniversities.length; i++) {
                   var userUniversity = new Parse.Object("UserUniversity");
                   userUniversity.set({
                                       user: user,
                                       university: matchUniversities[i],
                                       type: "match",
                                       recommendationBy: "Ana"

                   });
                   newShortlists[j] = userUniversity;
                   j++;
                }

                for(var i = 0; i < safeUniversities.length; i++) {
                   var userUniversity = new Parse.Object("UserUniversity");
                   userUniversity.set({
                                       user: user,
                                       university: safeUniversities[i],
                                       type: "safe",
                                       recommendationBy: "Ana"

                   });
                   newShortlists[j] = userUniversity;
                   j++;
                }

                var universityId = safeUniversities[0].id;

                /* Delete old shortlists from UserUniversity table
                * Insert new shortlists to UserUniversity table
                */
                var UserUniversity = Parse.Object.extend("UserUniversity");
                var deleteOldShortlistQuery = new Parse.Query(UserUniversity);
                deleteOldShortlistQuery.equalTo("user", user);
                deleteOldShortlistQuery.find().then(
                   function(oldShortlists) {
                       Parse.Object.destroyAll(oldShortlists);

                       Parse.Object.saveAll(newShortlists).then(
                           function(results) {
                               //response.success("Deleted old shortlists # " + oldShortlists.length + " Created new shortlists #" + newShortlists.length);
                                resolve("Shortlist updated!!!");
                           }, function (error) {
                                reject(Error("Shortlist failed"));
                           }
                       );
                   }
                );


                /* Update reco status */

                /* Send alerts */
            }
        );
    });

}

Parse.Cloud.define("getHasGotReco", function(request, response) {
    var userId = request.params.userId;
    var query = new Parse.Query("_User");
    query.equalTo("objectId", userId);

    Parse.Cloud.useMasterKey();

    query.first({
        success: function(user) {
                    if(user) {
                        response.success(user.get("hasGotReco"));
                    }
        },
        error: function(userVerification, error) {
            response.error(error);
        }
    });
});

/*
 * Get phone number of users who joined before 5th Nov, since when we got Mixpanel live
 */
Parse.Cloud.define("GetInactiveUsers", function(request, response) {
    var query = new Parse.Query("_User");
    query.select("name", "phone");
    var createdAtDate = new Date(2015,10,5);
    query.lessThan("createdAt", createdAtDate);
    query.limit(1000);
    query.find({
          success: function(results) {
                if(results.length > 0) {
                    var users = [];

                    for (var i = 0; i < results.length; i++) {
                      var name = results[i].get("name");
                      var phone = results[i].get("phone");
                      var createdAt = results[i].createdAt;
                      users[i] = phone;
                    }

                    response.success(users);
                } else {
                    response.error("No users found");
                }
          },error: function(error) {
                response.error("Failed to get inactive users: " + error.code + ":" + error.message);
          }
        });
});

Parse.Cloud.define("AlertForReply", function(request, response) {
    var userId = request.params.userId;
    var currentUserName = request.params.currentUserName;
    var tableName = request.params.tableName;
    var messageText = request.params.messageText;

    var query = new Parse.Query("_User");
    query.equalTo("objectId", userId);

    query.first({
            success: function(user) {
                        if(user) {
                            var phone = user.get("phone");
                            var email = user.get("email");

                            console.log("AlertForReply phone: " + phone + " email: " + email + " from user: " + currentUserName);

                            var emailSubject = currentUserName + " answered you on Admission Table";
                            var emailMessage = "Congratulation " + user.get("firstName") + "! You received an answer from " + currentUserName + ".";


                            if(tableName === "Private Chat") {
                                emailMessage += " Visit My Table > Private Chat > " + currentUserName + " on Admission Table app now to check it and respond.";
                            } else {
                                emailMessage += " Visit " + tableName + " table on Admission Table app now to check it and ask any more questions you may have.";
                            }

                            if(messageText) {
                                emailMessage += "\n\nHere is the response: " + messageText;
                            } else {
                            }

                            // sendgrid.sendEmail({
                            //     to: email,
                            //     from: "info@admissiontable.com",
                            //     subject: emailSubject,
                            //     text: emailMessage
                            //   }, {
                            //     success: function(httpResponse) {
                            //                 response.success("Email sent!");
                            //            },
                            //     error: function(httpResponse) {
                            //                 console.error(httpResponse);
                            //                 response.error("Uh oh, something went wrong: " + httpResponse);
                            //            }
                            // });
                            sendgrid.send({
							  	to: email,
                                from: "info@admissiontable.com",
                                subject: emailSubject,
                                text: emailMessage
							}, function(err, json) {
							  if (err) {
							  	response.error("Uh oh, something went wrong: " + err);
							  	return console.error(err); 
							  }
							  console.log(json);
							});

                            var smsMessage = currentUserName + " answered you!";

                            if(tableName === "Private Chat") {
                                smsMessage += " Visit My Table > Private Chat > " + currentUserName + " on Admission Table app now to view it.";
                            } else {
                                smsMessage += " Visit " + tableName + " table on Admission Table app now to check it.";
                            }

                            if(messageText) {
                                var responseMessage = " Response is: " + messageText;
                                var part1Length = smsMessage.length;
                                var part2Length = 157 - part1Length;

                                smsMessage += responseMessage.substring(0, part2Length) + "...";
                            }


                            /*Send SMS*/
                            Parse.Cloud.httpRequest({
                                method: 'POST',
                                url: 'https://control.msg91.com/sendhttp.php',
                                body: {
                                    authkey: '90188AcNvoNEnls55c5ea93',
                                    mobiles: phone,
                                    message: smsMessage,
                                    sender: 'ATABLE',
                                    route: '4',
                                    response: 'json'
                                }
                            });

                            response.success("AlertForReply phone: " + phone + " email: " + email);

                        }
            },
            error: function(userVerification, error) {
                response.error(error);
                console.log("AlertForReply Error: " + error.code + ":" + error.message);
            }
    });

});

Parse.Cloud.define("updateUniversity", function(request, response) {
    var universityName = request.params.universityName;
    var columnName = request.params.columnName;
    var columnValue = request.params.columnValue;

    var tableQuery = new Parse.Query("Table");
    tableQuery.equalTo("name", universityName);
    var universityQuery = new Parse.Query("University");
    universityQuery.matchesQuery("table", tableQuery);
    universityQuery.find({
      success: function(results) {
            if(results.length == 0) {
                response.error("No matching university found. Check university name - " + universityName);
            } else if(results.length > 1) {
                response.error("Multiple matching university found. Check university name - " + universityName);
            } else {
                response.success("Updating university: " + universityName);
            }
      },error: function(error) {
            response.error("Failed to update university: " + error.code + ":" + error.message);
      }
    });

});


Parse.Cloud.beforeSave("_User", function(request, response) { 
    var user = request.object;  

    /*This is a temporary fix - replace this by a check for user.get("image") not being undefined*/
    if(user) {
        response.success();
        return;
    }

    if (!user.dirty("image")) { 
        response.success(); 
        return; 
    }  

    console.log("creating user thumbnail");  

    Parse.Cloud.httpRequest({ 
        url: user.get("image").url()  
    }).then(function(response) { 
                var image = new Image(); 
                return image.setData(response.buffer);  
    }).then(function(image) { 
                /* Crop the image to the smaller of width or height.*/ 
                var size = Math.min(image.width(), image.height()); 
                return image.crop({ 
                    left: (image.width() - size) / 2, 
                    top: (image.height() - size) / 2, 
                    width: size, 
                    height: size 
                    });  
        }).then(function(image) { 
                    /* Resize the image to 64x64.*/ 
                    return image.scale({ 
                        width: 100, 
                        height: 100 
                    });  
        }).then(function(image) { 
                    /* Make sure it's a JPEG to save disk space and bandwidth.*/ 
                    return image.setFormat("JPEG");  
        }).then(function(image) { 
                    /* Get the image data in a Buffer.*/ 
                    return image.data();  
        }).then(function(buffer) { 
                    /* Save the image into a new file.*/ 
                    var base64 = buffer.toString("base64"); 
                    var cropped = new Parse.File("thumbnail.jpg", { base64: base64 }); 
                    return cropped.save();  
        }).then(function(cropped) { 
                    /* Attach the image file to the original object.*/ 
                    user.set("image", cropped);  
        }).then(function(result) { 
                    response.success(); 
                }, function(error) { 
                    response.error(error); 
        });
  });



Parse.Cloud.define("emailFeedback", function(request, response) {

  // sendgrid.sendEmail({
  //   to: "feedback@admissiontable.com",
  //   from: request.params.userEmail,
  //   subject: "Feedback on app by " + request.params.userName,
  //   text: request.params.message
  // }, {
  //   success: function(httpResponse) {
  //               response.success("Email sent!");
  //          },
  //   error: function(httpResponse) {
  //               console.error(httpResponse);
  //               response.error("Uh oh, something went wrong: " + httpResponse);
  //          }
  // });
  sendgrid.send({
	  	to: "feedback@admissiontable.com",
        from: request.params.userEmail,
        subject: "Feedback on app by " + request.params.userName,
        text: request.params.message
	}, function(err, json) {
	  if (err) {
	  	response.error("Uh oh, something went wrong: " + err);
	  	return console.error(err); 
	  }
	  console.log(json);
	});
});

Parse.Cloud.define("deleteUser", function(request, response) {
    var userId = request.params.userId;
    var query = new Parse.Query("_User");

    query.equalTo("objectId", userId);
    query.first({
        success: function(user) {
            if(user) {
                Parse.Cloud.useMasterKey();
                        user.destroy({
                          success: function(user) {
                            response.success("user deleted: " + userId);
                            console.log("user deleted: " + userId);
                          },
                          error: function(user, error) {
                            response.error("Failed to delete the user: " + userId + ":" + error.code + ":" + error.message);
                            console.log("Failed to delete the user: " + userId + ":" + error.code + ":" + error.message);
                          }
                        });
            } else {
                response.error("Failed to find the user: " + userId);
                console.log("Failed to find the user: " + userId);
            }

        },error: function(error) {
            response.error("Failed to find the user: " + error.code + ":" + error.message);
            console.log("Failed to find the user: " + error.code + ":" + error.message);
        }
    });



});

Parse.Cloud.define("updareUserRemark", function(request, response) {
    var userId = request.params.userId;
    var remark = request.params.remark;
    var query = new Parse.Query("_User");
    query.equalTo("objectId", userId);

    Parse.Cloud.useMasterKey();

    query.first({
        success: function(user) {
                    if(user) {
                        user.set("remark", remark);

                        user.save(null, { useMasterKey: true }).then(function() {
                            response.success();
                        }, function(error) {
                            response.error(error);
                        });

                    }
        },
        error: function(userVerification, error) {
            response.error(error);
        }
    });
});

Parse.Cloud.define("updateRecoRequestStatus", function(request, response) {
    var userId = request.params.userId;
    var query = new Parse.Query("_User");
    query.equalTo("objectId", userId);
    query.first({
                    success: function(user) {
                        if(user) {
                            user.set("hasGotReco", true);
                            user.set("gotRecoAt", new Date());

                            var recoAlertMessage = user.get("firstName") + ", your profile review is completed. Please check out your university shortlists on Admission Table app.";

                            user.save(null, { useMasterKey: true }).then(
                                function() {
                                    /* send push notification */
                                    var channel = "private-" + userId;
                                    var pushMessage = {
                                                            "userName" : user.get("name"),
                                                            "userId" : user.id,
                                                            "slug" : channel,
                                                            "format" : "text",
                                                            "type" : "private",
                                                            "message" : recoAlertMessage
                                                    };
                                    Parse.Cloud.httpRequest({
                                                        url: 'http://pubsub.pubnub.com/publish/' +
                                                              pubnub.publish_key   +   '/' +
                                                              pubnub.subscribe_key + '/0/' +
                                                              channel + '/0/' +
                                                              encodeURIComponent(JSON.stringify(pushMessage)),

                                                        success: function(httpResponse) {
                                                              console.log("Published: " + JSON.stringify(pushMessage));
                                                              console.log(httpResponse.text);
                                                              response.success();
                                                        },

                                                        error: function(httpResponse) {
                                                              console.error('Error: ' + httpResponse.status);
                                                        }
                                                });

                                    /*Send SMS*/
                                    Parse.Cloud.httpRequest({
                                    		method: 'POST',
                                    		url: 'https://control.msg91.com/sendhttp.php',
                                    		body: {
                                    			authkey: '90188AcNvoNEnls55c5ea93',
                                    			mobiles: user.get("phone"),
                                    			message: recoAlertMessage,
                                    			sender: 'ATABLE',
                                    			route: '4',
                                    			response: 'json'
                                    		}
                                    });

                                    var recoEmailMessage = recoAlertMessage + " " + "If you have any questions, feel free to ask on Help Desk or any other topic tables.";
                                    /* send email alert */
                                    // sendgrid.sendEmail({
                                    //     to: user.get("email"),
                                    //     from: "info@admissiontable.com",
                                    //     subject: "Your university shortlists from Admission Table",
                                    //     text: recoEmailMessage
                                    //     }, {
                                    //     success: function(httpResponse) {
                                    //          },
                                    //     error: function(httpResponse) {
                                    //             console.error("Failed to send OTP via email: " + httpResponse);
                                    //        }
                                    // });

                                    sendgrid.send({
									  	to: user.get("email"),
								        from: "info@admissiontable.com",
								        subject: "Your university shortlists from Admission Table",
								        text: recoEmailMessage
									}, function(err, json) {
									  if (err) {
									  	return console.error("Failed to send OTP via email: "+err); 
									  }
									  console.log(json);
									});

                                }, function(error) {
                                    response.error(error);
                                });
                        }
                    },
                    error: function(userVerification, error) {
                    }
                });
});


Parse.Cloud.afterSave("Message", function(request) {

    if(typeof request.object.get("originalImage") != 'undefined') {
        console.log("Updating original image for the message, skipping Pubnub publishing ...");
        return;
    }

    if(typeof request.object.get("editedBy") != 'undefined') {
        console.log("editing a message, skipping Pubnub publishing ...");
        return;
    }


    request.object.get("user").fetch().then(function (user) {
        request.object.get("table").fetch().then(function (table) {
            var channel = table.get("slug");
            var pushMessage = {
                        "slug" : table.get("slug"),
                        "tableName" : table.get("name"),
                        "userName" : user.get("name"),
                        "userId" : user.id,
                        "format" : request.object.get("format"),
                        "objectId" : request.object.id,
                        "type" : request.object.get("type"),
                        "createdAt" : request.object.createdAt,
                        "message" : request.object.get("message"),
                        "isActive" : request.object.get("isActive")
            };

            if(typeof request.object.get("image") != 'undefined') {
                pushMessage.image = request.object.get("image");
            }

            Parse.Cloud.httpRequest({
                    url: 'http://pubsub.pubnub.com/publish/' +
                          pubnub.publish_key   +   '/' +
                          pubnub.subscribe_key + '/0/' +
                          channel + '/0/' +
                          encodeURIComponent(JSON.stringify(pushMessage)),

                    success: function(httpResponse) {
                          console.log("Published: " + JSON.stringify(pushMessage));
                          console.log(httpResponse.text);
                    },

                    error: function(httpResponse) {
                          console.error('Error: ' + httpResponse.status);
                    }
            });

        });
    });


});


Parse.Cloud.define("verifyOTP", function (request, response) {
	var userOTP = request.params.userOTP;
	var userVerificationId = request.params.userVerificationId;
	
	var UserVerification = Parse.Object.extend("UserVerification");
	var query = new Parse.Query(UserVerification);
	
	query.get(userVerificationId, {
		success: function(userVerification) {
		    console.log("Got user verification details: " + userVerification.id + ":" + userVerification.get("otp"));
			var storedOTP = userVerification.get("otp");

			if(storedOTP == Number(userOTP)) {
			    var status = {status: "1"};
                response.success(status);
			    console.log("OTP Matched");

			} else {
			    var status = {status: "0", message: 'OTP_MISMATCH'};
                response.success(status);
			    console.log("OTP Mismatched");
			}


		},
		error: function (object, error) {
		    console.log("OTP Error");
            response.error('0');
		}
	});
});

//Send one time password
Parse.Cloud.define("createOTP", function (request,response) {
	var otp = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

    var personFirstName = request.params.firstName;
    var personLastName = request.params.lastName;
	var personName = personFirstName + personLastName;
	var personEmail = request.params.email;
	var personPhone = request.params.phone;
	var otpMessage = personFirstName + ', ' + otp + ' is your Admission Table verification code. Enter this code into the app to proceed.';

	Parse.Cloud.httpRequest({
		method: 'POST',
		url: 'https://control.msg91.com/sendhttp.php',
		body: {
			authkey: '90188AcNvoNEnls55c5ea93',
			mobiles: personPhone,
			message: otpMessage,
			sender: 'ATABLE',
			route: '4',
			response: 'json'
		}
	}).then(
		function(httpResponse) {

		    /* send email alert */
		    // sendgrid.sendEmail({
      //           to: personEmail,
      //           from: "info@admissiontable.com",
      //           subject: "Admission Table verification code",
      //           text: otpMessage
      //         }, {
      //           success: function(httpResponse) {
      //                  },
      //           error: function(httpResponse) {
      //                       console.error("Failed to send OTP via email: " + httpResponse);
      //                  }
      //       });

      		sendgrid.send({
			  	to: personEmail,
		        from: "info@admissiontable.com",
		        subject: "Admission Table verification code",
		        text: otpMessage
			}, function(err, json) {
			  if (err) {
			  	return console.error("Failed to send OTP via email: "+err); 
			  }
			  console.log(json);
			});

            var UserVerification = Parse.Object.extend("UserVerification");
            var query = new Parse.Query(UserVerification);
            query.equalTo("phone", personPhone);
            query.first({
                    success: function(userVerification) {
                        if(!userVerification) {
                            console.log("New user");
                            var UserVerification = Parse.Object.extend("UserVerification");
                            var userVerification = new UserVerification();

                        } else {
                            console.log("Existing user");
                        }

                        userVerification.set("name", personName);
                        userVerification.set("email", personEmail);
                        userVerification.set("phone", personPhone);
                        userVerification.set("verificationStatus", 0);
                        userVerification.set("otp", otp);

                        userVerification.save(null, {
                        	success: function(userVerification) {
                        		var status = {status: "1", userVerificationId: userVerification.id};
                        		response.success(status);
                        		console.log("User verification initiated for " + personPhone);
                        	},
                        	error: function(userDetails, error) {
                        		response.error('0');
                        		console.log("User verification failed for " + personPhone + ":" + error);
                        	}
                        });
                    },
                    error: function(userVerification, error) {
                    }
            });


		},
		function(httpResponse) {
			console.error('OTP request failed with response code: ' + httpResponse.status);
			response.error('0');
		}
	);
});


Parse.Cloud.define("helloPush", function(request, response) {

  var messageId = Math.floor(Math.random() * (1000000 - 1 + 1)) + 1;
  var query = new Parse.Query(Parse.Installation);
  query.equalTo('phone', '+919740563636');

  Parse.Push.send({
    where: query,
    data: {
      alert: "Hello push #" + messageId
    }
  }, {
    success: function() {
        response.success("#" + messageId + " pushed");
    },
    error: function(error) {
        response.error("Failed in pushing: " + error);
    }
  });

});

Parse.Cloud.define("hello", function(request, response) {
  response.success("Hello world!");
});

Parse.Cloud.define("helloEmail", function(request, response) {
  sendgrid.sendEmail({
    to: "manish.katyan@admissiontable.com",
    from: "info@admissiontable.com",
    subject: "Hello from Cloud Code!",
    text: "Using Parse and SendGrid is great!"
  }, {
    success: function(httpResponse) {
                response.success("Email sent!");
           },
    error: function(httpResponse) {
                console.error(httpResponse);
                response.error("Uh oh, something went wrong: " + httpResponse);
           }
  });
});

