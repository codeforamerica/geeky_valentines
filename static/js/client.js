var selected_card = "";
$(document).ready(function(){
    var howToTimer = 0;
    var hideHowTo = function(){
        $("div.howto").hide();
        clearTimeout(howToTimer);
        howToTimer = setTimeout(showHowTo, 5000);
    }
    var showHowTo = function(){
        $("div.howto").fadeIn("normal");
    };
    hideHowTo();
    $("div.card").click(function(){
        if($(this).is(".flip")){
            $("div.aloha").removeClass("flip");
            hideHowTo();
        }else{
            $("div.aloha").addClass("flip");
            hideHowTo();
        }

    });


    $("input#submit").click(function(){
        var postdata = {"toname":$("#toname").val(),
                        "toaddress":$("#toaddress").val(),
                        "fromname":$("#fromname").val(),
                        "fromaddress":$("#fromaddress").val(),
                        "message":$("#message").val(),
                        "card":selected_card
                       };
        $.post("/send", postdata, function(data){
            if(data.status == "ok"){
                $("div.step").html("");
                $("#form").html("<div class='status'>Card Sent!</div>");
            }else{
                $("div.steps").html("step oops: something went wrong, try again");
            }
        }, "json");
    });
    var card_valign = function(){
        var top_margin = $(window).height() / 2 -250;
        $(".card").css("margin-top", top_margin);
        
    };

    $(window).resize(card_valign);
    card_valign();


    $("#cards li").click(function(){
        selected_card = $(this).attr("id").split("-")[1];
        $("#cards").fadeOut("250",function(){$("#form").fadeIn();});

        $("div.step").html("step two: add a thoughful message");
        
    });

});