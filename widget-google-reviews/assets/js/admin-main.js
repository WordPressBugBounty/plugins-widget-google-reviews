jQuery(document).ready(function(a){a(".grw-admin-page a.nav-tab").on("click",function(A){var w=a(this),B=w.attr("href");a(B).show().siblings(".tab-content").hide();w.addClass("nav-tab-active").siblings().removeClass("nav-tab-active");A.preventDefault()});var c=a("#grw-rate_us");if(c.length){var b=a("#grw-rate_us-feedback"),d=a("#grw-rate_us-feedback-stars");grw_svg_init();-1<window.location.href.indexOf("grw_feed_id=")&&!window.grw_rateus&&c.addClass("grw-flash-visible");a(".wp-star",c).click(function(){var w=
a(this).index()+1;3<w?(a.post({url:ajaxurl,type:"POST",dataType:"json",data:{action:"grw_rateus_ajax",rate:w},success:function(B){console.log(B)}}),window.open("https://wordpress.org/support/plugin/widget-google-reviews/reviews/?rate="+w+"#new-post","_blank"),A()):(d.attr("data-rate",w),d.html(grw_stars(w,"#fb8e28",24)),b.dialog({modal:!0,width:"50%",maxWidth:"600px"}),a(".ui-widget-overlay").bind("click",function(){b.dialog("close")}))});a(".grw-rate_us-cancel").click(function(){b.dialog("close")});
a(".grw-rate_us-send").click(function(){a.post({url:ajaxurl,type:"POST",dataType:"json",data:{action:"grw_rateus_ajax_feedback",rate:d.attr("data-rate"),email:a("input",b).val(),msg:a("textarea",b).val()},success:function(w){b.dialog({title:"Feedback sent"});b.html('<b style="color:#4cc74b">Thank you for your feedback!<br>We received it and will investigate your suggestions.</b>');A();setTimeout(function(){b.fadeOut(500,function(){b.dialog("close")})},1500)}})});function A(){setTimeout(function(){c.addClass("grw-flash-gout");
c.removeClass("grw-flash-visible");c.removeClass("grw-flash-gout");window.grw_rateus=1},1E3)}}if(a("#grw-overview-rating").length){var h=6,f=a("#grw-overview-places"),e=a("#grw-overview-months"),l=a("#grw-overview-rating"),y=a("#grw-overview-reviews"),C=null;grw_svg_init();f.change(function(){A(this.value)});e.change(function(){h=this.value;A(f.val())});A(0,function(w){a.each(w.places,function(B,D){f.append(a("<option>",{value:D.id,text:D.name}))})});function A(w,B){var D={action:"grw_overview_ajax"};
w&&(D.place_id=w);jQuery.post({url:ajaxurl,type:"POST",dataType:"json",data:D,success:function(t){var n=1<t.places.length?t.places.find(E=>E.id==w):t.places[0],q=null;if(t.stats_minmax.length){var k={},u=0,r=((new Date).getTime()/1E3).toFixed(0);for(var z=0;z<t.stats_minmax.length;z++){var x=t.stats_minmax[z],v=x.google_place_id;u=!u||x.time<u?x.time:u;k[v]?(k[v]={time:parseInt(r-k[v].time),rating:parseFloat((x.rating-k[v].rating).toFixed(1)),review_count:parseInt(x.review_count-k[v].review_count)},
q=q?{time:k[v].time,rating:q.rating+k[v].rating,review_count:q.review_count+k[v].review_count}:k[v],delete k[v]):k[v]={time:u,rating:x.rating,review_count:x.review_count}}}k=a("#grw-overview-stats");k.html("Not calculated yet");q&&(u=q.rating,r=q.review_count,k.html('<div class="grw-overview-h">While using the plugin</div><div>Usage time: <span class="grw-stat-val grw-stat-up">'+grw_s2dmy(q.time)+'</span></div><div>Rating up: <span class="grw-stat-val grw-stat-'+(0>u?"down":0<u?"up":"")+'">'+u+'</span></div><div>Reviews up: <span class="grw-stat-val grw-stat-'+
(0>r?"down":0<r?"up":"")+'">'+r+"</span></div>"));l.html('<div class="wp-gr"><div class="grw-overview-h">'+n.name+'</div><div><span class="wp-google-rating">'+t.rating+'</span><span class="wp-google-stars">'+grw_stars(t.rating,"#fb8e28",20)+'</span></div><div class="wp-google-powered">Based on '+t.review_count+" reviews</div>"+(n.updated?'<div class="wp-google-powered">Last updated: <span class="wp-google-time">'+rpi.Time.getTime(parseInt(n.updated),rpi.Utils.lang(),"ago")+"</span></div>":"")+"</div>");
var F="";n=rpi.Common(y[0],{text_size:50},{time:"wp-google-time",text:"wp-google-text",readmore:"wp-more-toggle"});a.each(t.reviews,function(E,I){F+=grw_review(I)});y.html('<div class="wp-gr wpac"><div class="wp-google-reviews">'+F+"</div></div>");n.init();a(".wp-review-hide",y).unbind("click").click(function(){grw_review_hide(a(this));return!1});q={};for(n=0;n<t.stats.length;n++)k=t.stats[n],u=k.google_place_id,q[u]=q[u]||[],q[u].push({time:parseInt(k.time),rating:parseFloat(k.rating),review_count:parseInt(k.review_count)});
n=parseInt((t.stats[0].time-t.stats[t.stats.length-1].time)/2592E3);u=4<n?h:n||1;n={};r=new Date;for(z=0;z<u;z++)for(g in k=new Date(r.getFullYear(),r.getMonth()-z,1),x=(new Date(r.getFullYear(),r.getMonth()+1-z,0)).getTime(),v=k.toLocaleString("default",{month:"short"})+" "+k.getFullYear().toString().slice(-2),n[v]=n[v]||{},q){var G=0,H=q[g];do{k=H[G++];var J=1E3*k.time;n[v][g]=n[v][g]||{};n[v][g].count=parseInt(k.review_count)}while(J>x&&G<H.length)}q=[];k=[];u=[];r={};for(m in n){z=0;for(p in n[m])z+=
n[m][p].count,x=t.places.find(E=>E.id==p),r[x.name]=r[x.name]||{},r[x.name].data=r[x.name].data||[],r[x.name].data.unshift(n[m][p].count);q.unshift(m);k.unshift(z)}for(tt in r)u.push({name:tt,data:r[tt].data});n={series:[{name:"Reviews",data:k}],chart:{height:350,type:"bar"},plotOptions:{bar:{dataLabels:{position:"top"}}},dataLabels:{enabled:!0,offsetY:-20,style:{fontSize:"12px",colors:["#304758"]}},tooltip:{enabled:!0,intersect:!1,custom:function(){return""}},xaxis:{categories:q,axisBorder:{show:!1},
axisTicks:{show:!1},tooltip:{enabled:!0}},yaxis:{axisBorder:{show:!1},axisTicks:{show:!1}},title:{text:"Monthly reviews count",align:"center",style:{color:"#444"}}};C?C.updateOptions({series:[{name:"Reviews",data:k}],xaxis:{categories:q}}):(C=new ApexCharts(document.querySelector("#chart"),n),C.render());B&&B(t)}})}}});function grw_svg_init(){var a=document.createElement("span");a.style.display="none";a.innerHTML=grw_svg();document.body.appendChild(a)}
function grw_svg(){return'<svg><defs><g id="rp-star" width="17" height="17"><path d="M1728 647q0 22-26 48l-363 354 86 500q1 7 1 20 0 21-10.5 35.5t-30.5 14.5q-19 0-40-12l-449-236-449 236q-22 12-40 12-21 0-31.5-14.5t-10.5-35.5q0-6 2-20l86-500-364-354q-25-27-25-48 0-37 56-46l502-73 225-455q19-41 49-41t49 41l225 455 502 73q56 9 56 46z"></path></g><g id="rp-star-half" width="17" height="17"><path d="M1250 957l257-250-356-52-66-10-30-60-159-322v963l59 31 318 168-60-355-12-66zm452-262l-363 354 86 500q5 33-6 51.5t-34 18.5q-17 0-40-12l-449-236-449 236q-23 12-40 12-23 0-34-18.5t-6-51.5l86-500-364-354q-32-32-23-59.5t54-34.5l502-73 225-455q20-41 49-41 28 0 49 41l225 455 502 73q45 7 54 34.5t-24 59.5z"></path></g><g id="rp-star-o" width="17" height="17"><path d="M1201 1004l306-297-422-62-189-382-189 382-422 62 306 297-73 421 378-199 377 199zm527-357q0 22-26 48l-363 354 86 500q1 7 1 20 0 50-41 50-19 0-40-12l-449-236-449 236q-22 12-40 12-21 0-31.5-14.5t-10.5-35.5q0-6 2-20l86-500-364-354q-25-27-25-48 0-37 56-46l502-73 225-455q19-41 49-41t49 41l225 455 502 73q56 9 56 46z" fill="#ccc"></path></g><g id="rp-logo-g" height="44" width="44" fill="none" fill-rule="evenodd"><path d="M482.56 261.36c0-16.73-1.5-32.83-4.29-48.27H256v91.29h127.01c-5.47 29.5-22.1 54.49-47.09 71.23v59.21h76.27c44.63-41.09 70.37-101.59 70.37-173.46z" fill="#4285f4"></path><path d="M256 492c63.72 0 117.14-21.13 156.19-57.18l-76.27-59.21c-21.13 14.16-48.17 22.53-79.92 22.53-61.47 0-113.49-41.51-132.05-97.3H45.1v61.15c38.83 77.13 118.64 130.01 210.9 130.01z" fill="#34a853"></path><path d="M123.95 300.84c-4.72-14.16-7.4-29.29-7.4-44.84s2.68-30.68 7.4-44.84V150.01H45.1C29.12 181.87 20 217.92 20 256c0 38.08 9.12 74.13 25.1 105.99l78.85-61.15z" fill="#fbbc05"></path><path d="M256 113.86c34.65 0 65.76 11.91 90.22 35.29l67.69-67.69C373.03 43.39 319.61 20 256 20c-92.25 0-172.07 52.89-210.9 130.01l78.85 61.15c18.56-55.78 70.59-97.3 132.05-97.3z" fill="#ea4335"></path><path d="M20 20h472v472H20V20z"></path></g></defs></svg>'}
function grw_stars(a,c,b){for(var d="",h=1;6>h;h++){var f=a-h;d=0<=f?d+grw_star("",c,b):-1<f&&0>f?-.75>f?d+grw_star("-o","#ccc",b):-.25<f?d+grw_star("",c,b):d+grw_star("-half",c,b):d+grw_star("-o","#ccc",b)}return d}function grw_star(a,c,b){return'<span class="wp-star"><svg viewBox="0 0 1792 1792" width="'+b+'" height="'+b+'"><use xlink:href="#rp-star'+a+'" fill="'+c+'"/></svg></span>'}
function grw_review(a){return'<div class="wp-google-review'+(""==a.hide?"":" wp-review-hidden")+'"><div class="wp-google-right"><a href="'+a.author_url+'" class="wp-google-name" target="_blank" rel="nofollow noopener">'+a.author_name+'</a><div class="wp-google-time" data-time="'+a.time+'"></div><div class="wp-google-feedback"><span class="wp-google-stars">'+grw_stars(a.rating,"#fb8e28",16)+'</span><span class="wp-google-text">'+a.text+'</span></div><a href="#" class="wp-review-hide" data-id="'+a.id+
'">'+(""==a.hide?"Hide":"Show")+" review</a></div></div>"}function grw_s2dmy(a){a=(a/86400).toFixed(0);return 30<a?365<a?Math.round(a/365)+" years":Math.round(a/30)+" months":a+" days"}const GRW_AUTOSAVE_KEYUP_TIMEOUT=1500;var GRW_AUTOSAVE_TIMEOUT=null;
const GRW_LANGS=[["ar","Arabic"],["bg","Bulgarian"],["bn","Bengali"],["ca","Catalan"],["cs","Czech"],["da","Danish"],["de","German"],["el","Greek"],["en","English"],["es","Spanish"],["eu","Basque"],["eu","Basque"],["fa","Farsi"],["fi","Finnish"],["fil","Filipino"],["fr","French"],["gl","Galician"],["gu","Gujarati"],["hi","Hindi"],["hr","Croatian"],["hu","Hungarian"],["id","Indonesian"],["it","Italian"],["iw","Hebrew"],["ja","Japanese"],["kn","Kannada"],["ko","Korean"],["lt","Lithuanian"],["lv","Latvian"],
["ml","Malayalam"],["mr","Marathi"],["nl","Dutch"],["no","Norwegian"],["pl","Polish"],["pt","Portuguese"],["pt-BR","Portuguese (Brazil)"],["pt-PT","Portuguese (Portugal)"],["ro","Romanian"],["ru","Russian"],["sk","Slovak"],["sl","Slovenian"],["sr","Serbian"],["sv","Swedish"],["ta","Tamil"],["te","Telugu"],["th","Thai"],["tl","Tagalog"],["tr","Turkish"],["uk","Ukrainian"],["vi","Vietnamese"],["zh","Chinese (Simplified)"],["zh-Hant","Chinese (Traditional)"]];var GRW_HTML_CONTENT='<div class="grw-builder-platforms grw-builder-inside"><div class="grw-builder-connect grw-connect-google">Google Connection</div><div id="grw-connect-wizard" title="Google reviews connection" style="display:none;"><iframe id="gpidc" src="https://app.richplugins.com/gpidc?authcode={{authcode}}" style="width:100%;height:400px"></iframe><small class="grw-connect-error"></small></div><div class="grw-connections"></div></div><div class="grw-connect-options"><div class="grw-builder-inside"><div class="grw-builder-option">Layout<select id="view_mode" name="view_mode"><option value="slider" selected="selected">Slider</option><option value="grid">Grid</option><option value="list">List</option><option value="rating">Rating</option></select></div></div><div class="grw-builder-top grw-toggle">Common Options</div><div class="grw-builder-inside" style="display:none"><div class="grw-builder-option">Pagination<input type="text" name="pagination" value=""></div><div class="grw-builder-option">Maximum characters before \'read more\' link<input type="text" name="text_size" value=""></div><div class="grw-builder-option"><label><input type="checkbox" name="header_center" value="">Show rating by center</label></div><div class="grw-builder-option"><label><input type="checkbox" name="header_hide_photo" value="">Hide business photo</label></div><div class="grw-builder-option"><label><input type="checkbox" name="header_hide_name" value="">Hide business name</label></div><div class="grw-builder-option"><label><input type="checkbox" name="hide_based_on" value="">Hide \'Based on ... reviews\'</label></div><div class="grw-builder-option"><label><input type="checkbox" name="hide_writereview" value="">Hide \'review us on G\' button</label></div><div class="grw-builder-option"><label><input type="checkbox" name="header_hide_social" value="">Hide rating header, leave only reviews</label></div><div class="grw-builder-option"><label><input type="checkbox" name="hide_reviews" value="">Hide reviews, leave only rating header</label></div></div><div class="grw-builder-top grw-toggle">Slider Options</div><div class="grw-builder-inside" style="display:none"><div class="grw-builder-option">Speed in second<input type="text" name="slider_speed" value="" placeholder="Default: 3"></div><div class="grw-builder-option">Text height<input type="text" name="slider_text_height" value="" placeholder="Default: 100px"></div><div class="grw-builder-option"><label><input type="checkbox" name="slider_autoplay" value="" checked>Auto-play</label></div><div class="grw-builder-option"><label><input type="checkbox" name="slider_mousestop" value="" checked>Stop auto play on mouse over</label></div><div class="grw-builder-option"><label><input type="checkbox" name="slider_hide_prevnext" value="">Hide prev & next buttons</label></div><div class="grw-builder-option"><label><input type="checkbox" name="slider_hide_dots" value="">Hide dots</label></div></div><div class="grw-builder-top grw-toggle">Style Options</div><div class="grw-builder-inside" style="display:none"><div class="grw-builder-option"><input type="color" name="--star-color" value="#fb8e28" data-val="#fb8e28" data-defval="#fb8e28"/><input type="text" value="#fb8e28"/>Stars color</div><div class="grw-builder-option"><input type="color" name="--btn-color" value="#1f67e7" data-val="#1f67e7" data-defval="#1f67e7"/><input type="text" value="#1f67e7"/>Button color</div><div class="grw-builder-option"><input type="color" name="--rev-color" value="#fafafa" data-val="#fafafa" data-defval="#fafafa"/><input type="text" value="#fafafa"/>Reviews color</div><div class="grw-builder-option"><input type="color" name="--text-color" value="#222222" data-val="#222222" data-defval="#222222"/><input type="text" value="#222222"/>Reviews text color</div><div class="grw-builder-option"><label><input type="checkbox" name="dark_theme">Dark background</label></div><div class="grw-builder-option"><label><input type="checkbox" name="hide_backgnd" value="">Hide reviews background</label></div><div class="grw-builder-option"><label><input type="checkbox" name="show_round" value="">Round reviews borders</label></div><div class="grw-builder-option"><label><input type="checkbox" name="show_shadow" value="">Show reviews shadow</label></div><div class="grw-builder-option"><label><input type="checkbox" name="centered" value="">Place by center (only if max-width is set)</label></div><div class="grw-builder-option">Container max-width<input type="text" name="max_width" value="" placeholder="for instance: 300px"><small>Be careful: this will make reviews unresponsive</small></div><div class="grw-builder-option">Container max-height<input type="text" name="max_height" value="" placeholder="for instance: 500px"></div><input id="style_vars" name="style_vars" type="hidden"/></div><div class="grw-builder-top grw-toggle">Advance Options</div><div class="grw-builder-inside" style="display:none"><div class="grw-builder-option"><label><input type="checkbox" name="lazy_load_img" checked>Lazy load images</label></div><div class="grw-builder-option"><label><input type="checkbox" name="google_def_rev_link">Use default Google reviews link</label><span class="grw-quest grw-quest-top grw-toggle" title="Click to help">?</span><div class="grw-quest-help" style="display:none;">If the direct link to all reviews <b>https://search.google.com/local/reviews?placeid=&lt;PLACE_ID&gt;</b> does not work with your Google place (leads to 404), please use this option to use the default reviews link to Google map.</div></div><div class="grw-builder-option"><label><input type="checkbox" name="open_link" checked>Open links in new Window</label></div><div class="grw-builder-option"><label><input type="checkbox" name="nofollow_link" checked>Use no follow links</label></div><div class="grw-builder-option">Reviewer avatar size<select name="reviewer_avatar_size"><option value="56" selected="selected">Small: 56px</option><option value="128">Medium: 128px</option><option value="256">Large: 256px</option></select></div><div class="grw-builder-option">Cache data<select name="cache"><option value="1">1 Hour</option><option value="3">3 Hours</option><option value="6">6 Hours</option><option value="12" selected="selected">12 Hours</option><option value="24">1 Day</option><option value="48">2 Days</option><option value="168">1 Week</option><option value="">Disable (NOT recommended)</option></select></div><div class="grw-builder-option">Reviews limit<input type="text" name="reviews_limit" value=""></div></div></div>';
function grw_stylechange2(a){let c=document.getElementsByClassName("wp-gr")[0];if("range"==a.type||"color"==a.type){var b=a.value+(a.getAttribute("data-postfix")||"");a.setAttribute("data-val",b);c.style.setProperty(a.name,b);"color"==a.type&&(a.nextSibling.value=b)}else if("checkbox"==a.type||"radio"==a.type){if(b=a.getAttribute("data-vars")){b=b.split(";");for(let d=0;d<b.length;d++){let h=b[d].split(":");1<h.length&&(a.checked?(h[1].trim(),c.style.setProperty(h[0].trim(),h[1].trim())):c.style.removeProperty(h[0].trim()))}}a.checked?
c.style.setProperty(a.name,a.getAttribute("data-on")):a.getAttribute("data-off")?c.style.setProperty(a.name,a.getAttribute("data-off")):c.style.removeProperty(a.name)}window.style_vars.value=c.getAttribute("style")}
function grw_builder_init(a,c){var b=document.querySelector(c.el);if(b){b.innerHTML=GRW_HTML_CONTENT.replace("{{authcode}}",c.authcode);var d=a("#grw-connect-wizard");c.conns&&c.conns.connections&&c.conns.connections.length?grw_deserialize_connections(a,b,c):(a(".grw-connect-google").hide(),d.dialog({modal:!1,width:"50%",maxWidth:"600px",closeOnEscape:!1,open:function(){a(".ui-dialog-titlebar-close").hide()}}));window.onmessage=function(h){if("https://app.richplugins.com"===h.origin&&h.data){let f=
h.data;switch(f.action){case "get_place":a.post(ajaxurl,{pid:f.pid,token:f.token,action:"grw_get_place",grw_nonce:jQuery("#grw_nonce").val()},function(e){"success"==e.status?(e.result.place_id=f.pid,window.gpidc.contentWindow.postMessage({data:e,action:"set_place"},"*")):grw_connect_error(a,e.result.error_message)});break;case "connect":grw_connect_ajax(a,b,f,f.authcode,1)}}};a('.grw-connect-options input[type="text"],.grw-connect-options textarea').keyup(function(){clearTimeout(GRW_AUTOSAVE_TIMEOUT);
GRW_AUTOSAVE_TIMEOUT=setTimeout(grw_serialize_connections,GRW_AUTOSAVE_KEYUP_TIMEOUT)});a('.grw-connect-options input[type="checkbox"],.grw-connect-options select').change(function(){grw_serialize_connections()});a('.grw-connect-options input[name^="--"]').on("input",function(){grw_stylechange2(this);clearTimeout(GRW_AUTOSAVE_TIMEOUT);GRW_AUTOSAVE_TIMEOUT=setTimeout(grw_serialize_connections,GRW_AUTOSAVE_KEYUP_TIMEOUT)});a('.grw-connect-options input[type="color"][name^="--"] + input[type="text"]').change(function(){this.previousElementSibling.value=
this.value;this.previousElementSibling.dispatchEvent(new Event("change"))});a(".grw-toggle",b).unbind("click").click(function(){a(this).toggleClass("toggled");a(this).next().slideToggle()});a(".grw-builder-connect.grw-connect-google").click(function(){d.dialog({modal:!0,width:"50%",maxWidth:"600px"})});a(".grw-connections").sortable&&(a(".grw-connections").sortable({stop:function(h,f){grw_serialize_connections()}}),a(".grw-connections").disableSelection());a(".wp-review-hide").click(function(){grw_review_hide(a(this));
return!1});a("#grw_save").click(function(){grw_serialize_connections();return!1});window.addEventListener("beforeunload",function(h){if(GRW_AUTOSAVE_TIMEOUT)return(h||window.event).returnValue="It looks like you have been editing something. If you leave before saving, your changes will be lost."})}}
function grw_feed_save_ajax(){if(!window.grw_title.value)return window.grw_title.focus(),!1;window.grw_save.innerText="Auto save, wait";window.grw_save.disabled=!0;jQuery.post(ajaxurl,{post_id:window.grw_post_id.value,title:window.grw_title.value,content:document.getElementById("grw-builder-connection").value,action:"grw_feed_save_ajax",grw_nonce:jQuery("#grw_nonce").val()},function(a){for(var c=document.querySelectorAll(".wp-gr"),b=0;b<c.length;b++)c[b].parentNode.removeChild(c[b]);window.grw_collection_preview.innerHTML=
a;jQuery(".wp-review-hide").unbind("click").click(function(){grw_review_hide(jQuery(this));return!1});window.grw_post_id.value?(a=jQuery("#grw-rate_us"),!a.length||a.hasClass("grw-flash-visible")||window.grw_rateus||a.addClass("grw-flash-visible")):(a=document.querySelector(".wp-gr").getAttribute("data-id"),window.grw_post_id.value=a,window.location.href=GRW_VARS.builderUrl+"&grw_feed_id="+a+"&grw_feed_new=1");window.grw_save.innerText="Save & Update";window.grw_save.disabled=!1;GRW_AUTOSAVE_TIMEOUT=
null})}function grw_review_hide(a){jQuery.post(ajaxurl,{id:a.attr("data-id"),feed_id:jQuery('input[name="grw_feed[post_id]"]').val(),grw_wpnonce:jQuery("#grw_nonce").val(),action:"grw_hide_review"},function(c){var b=a.parent().parent();c.hide?(a.text("show review"),b.addClass("wp-review-hidden")):(a.text("hide review"),b.removeClass("wp-review-hidden"))},"json")}
function grw_connect_ajax(a,c,b,d,h){c.querySelector(".grw-connect-btn");window.grw_save.innerText="Auto save, wait";window.grw_save.disabled=!0;a.post(ajaxurl,{id:decodeURIComponent(b.id),lang:b.lang,local_img:b.local_img||!1,token:b.token,feed_id:a('input[name="grw_feed[post_id]"]').val(),grw_wpnonce:a("#grw_nonce").val(),action:"grw_connect_google",v:(new Date).getTime()},function(f){console.log("grw_connect_debug:",f);var e=document.querySelector(".grw-connect-error");if("success"==f.status){e.innerHTML=
"";try{a("#grw-connect-wizard").dialog("close")}catch(l){}grw_connection_add(a,c,{id:f.result.id,lang:b.lang,name:f.result.name,photo:f.result.photo,refresh:!0,local_img:b.local_img,platform:"google",props:{default_photo:f.result.photo}},d);grw_serialize_connections()}else grw_connect_error(a,f.result.error_message,function(){1<h||grw_popup("https://app.richplugins.com/gpaw/botcheck?authcode="+d,640,480,function(){grw_connect_ajax(a,c,b,d,h+1)})})},"json")}
function grw_connect_error(a,c,b){let d=document.querySelector(".grw-connect-error");d.innerHTML="";switch(c){case "usage_limit":a("#dialog").dialog({width:"50%",maxWidth:"600px"});break;case "bot_check":b&&b();break;default:0<=c.indexOf("The provided Place ID is no longer valid")?d.innerHTML='It seems Google place which you are trying to connect does not have a physical address (it\'s virtual or service area), unfortunately, Google Places API does not support such locations, it\'s a limitation of Google, not the plugin.<br><br>However, you can try to connect your Google reviews in our new cloud service <a href="https://trust.reviews" target="_blank">Trust.Reviews</a> and show it on your WordPress site through universal <b>HTML/JavaScript</b> code.':
d.innerHTML="<b>Error</b>: "+c}}
function grw_connection_add(a,c,b,d,h,f){c=grw_connection_id(b);var e=a("#"+c);e.length||(e=a('<div class="grw-connection"></div>')[0],e.id=c,void 0!=b.lang&&e.setAttribute("data-lang",b.lang),e.setAttribute("data-platform",b.platform),e.innerHTML=grw_connection_render(b,h),h=a(".grw-connections")[0],f?h.appendChild(e):h.prepend(e),jQuery(".grw-toggle",e).unbind("click").click(function(){jQuery(this).toggleClass("toggled");jQuery(this).next().slideToggle()}),jQuery(".grw-connect-photo-change",e).on("click",
function(l){l.preventDefault();grw_upload_photo(e,void 0,function(){grw_serialize_connections()});return!1}),jQuery(".grw-connect-photo-default",e).on("click",function(l){grw_change_photo(e,b.props.default_photo);grw_serialize_connections();return!1}),a('input[type="text"]',e).keyup(function(){clearTimeout(GRW_AUTOSAVE_TIMEOUT);GRW_AUTOSAVE_TIMEOUT=setTimeout(grw_serialize_connections,GRW_AUTOSAVE_KEYUP_TIMEOUT)}),a('input[type="checkbox"]',e).click(function(){grw_serialize_connections()}),a("select.grw-connect-lang",
e).change(function(){b.lang=this.value;e.id=grw_connection_id(b);e.setAttribute("data-lang",this.value);window.gpidc.contentWindow.postMessage({params:b,action:"connect"},"*");return!1}),a('input[name="local_img"]',e).unbind("click").click(function(){b.local_img=this.checked;window.gpidc.contentWindow.postMessage({params:b,action:"connect"},"*")}),a(".grw-connect-reconnect",e).click(function(){window.gpidc.contentWindow.postMessage({params:b,action:"connect"},"*");return!1}),a(".grw-connect-delete",
e).click(function(){confirm("Are you sure to delete this business?")&&(a(e).remove(),grw_serialize_connections());return!1}))}function grw_connection_id(a){var c="grw-"+a.platform+"-"+a.id.replace(/\//g,"");null!=a.lang&&(c+=a.lang);return c}
function grw_connection_render(a,c){var b=a.name;a.lang&&(b+=" ("+a.lang+")");a.photo=a.photo||"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";var d=document.createElement("option");d.value="google"==a.platform&&a.props&&a.props.place_id?a.props.place_id:a.id;d.text=grw_capitalize(a.platform)+": "+a.name;c='<div class="grw-toggle grw-builder-connect grw-connect-business"><input type="checkbox" class="grw-connect-select" onclick="event.stopPropagation();" '+(c?"checked":
"")+" /> "+b+(a.address?" ("+a.address+")":"")+'</div><div style="display:none">';b=a.props;d="";for(prop in b)"platform"!=prop&&Object.prototype.hasOwnProperty.call(b,prop)&&(d+='<input type="hidden" name="'+prop+'" value="'+b[prop]+'" class="grw-connect-prop" readonly />');return c+d+'<input type="hidden" name="id" value="'+a.id+'" readonly />'+(a.address?'<input type="hidden" name="address" value="'+a.address+'" readonly />':"")+(a.access_token?'<input type="hidden" name="access_token" value="'+
a.access_token+'" readonly />':"")+'<div class="grw-builder-option"><img src="'+a.photo+'" alt="'+a.name+'" class="grw-connect-photo"><a href="#" class="grw-connect-photo-change">Change</a><a href="#" class="grw-connect-photo-default">Default</a><input type="hidden" name="photo" class="grw-connect-photo-hidden" value="'+a.photo+'" tabindex="2"/></div><div class="grw-builder-option"><input type="text" name="name" value="'+a.name+'" /></div>'+(void 0!=a.website?'<div class="grw-builder-option"><input type="text" name="website" value="'+
a.website+'" /></div>':"")+(void 0!=a.lang?'<div class="grw-builder-option">'+grw_lang("Show all connected languages",a.lang)+"</div>":"")+(void 0!=a.review_count?'<div class="grw-builder-option"><input type="text" name="review_count" value="'+a.review_count+'" placeholder="Total number of reviews" /><span class="grw-quest grw-toggle" title="Click to help">?</span><div class="grw-quest-help">Google return only 5 most helpful reviews and does not return information about total number of reviews and you can type here it manually.</div></div>':
"")+(void 0!=a.refresh?'<div class="grw-builder-option"><label><input type="checkbox" name="refresh" '+(a.refresh?"checked":"")+'>Update reviews daily</label><span class="grw-quest grw-quest-top grw-toggle" title="Click to help">?</span><div class="grw-quest-help">'+("google"==a.platform?"The plugin uses the Google Places API to get your reviews. <b>The API only returns the 5 most helpful reviews (it's a limitation of Google, not the plugin)</b>. This option calls the Places API once in 24 hours (to keep the plugin's free and avoid a Google Billing) to check for a new reviews and if there are, adds to the plugin. Thus slowly building up a database of reviews.<br><br>Also if you see the new reviews on Google map, but after some time it's not added to the plugin, it means that Google does not include these reviews to the API and the plugin can't get this.<br><br>If you need to show <b>all reviews</b>, please use <a href=\"https://richplugins.com/business-reviews-bundle-wordpress-plugin?promo=GRGROW23\" target=\"_blank\">Business plugin</a> which uses a Google My Business API without API key and billing.":
"")+("yelp"==a.platform?"The plugin uses the Yelp API to get your reviews. <b>The API only returns the 3 most helpful reviews without sorting possibility.</b> When Yelp changes the 3 most helpful the plugin will automatically add the new one to your database. Thus slowly building up a database of reviews.":"")+"</div></div>":"")+'<div class="grw-builder-option"><label><input type="checkbox" name="local_img" '+(a.local_img?"checked":"")+'>Save images locally (GDPR)</label></div><div class="grw-builder-option"><button class="grw-connect-reconnect">Reconnect</button></div><div class="grw-builder-option"><button class="grw-connect-delete">Delete connection</button></div></div>'}
function grw_serialize_connections(){var a=[],c=document.querySelectorAll(".grw-connection");for(y in c)if(Object.prototype.hasOwnProperty.call(c,y)){var b=c[y].querySelector(".grw-connect-select");if(!b||grw_is_hidden(b)||b.checked){var d={};b=c[y].getAttribute("data-lang");var h=c[y].getAttribute("data-platform"),f=c[y].querySelectorAll("input");void 0!=b&&(d.lang=b);for(var e in f)if(Object.prototype.hasOwnProperty.call(f,e)){b=f[e];var l=b.getAttribute("name");l&&("grw-connect-prop"==b.className?
(d.props=d.props||{},d.props[l]=b.value):d[l]="checkbox"==b.type?b.checked:b.value)}d.platform=h;a.push(d)}}c={};var y=document.querySelector(".grw-connect-options").querySelectorAll("input[name],select,textarea");for(var C in y)Object.prototype.hasOwnProperty.call(y,C)&&(b=y[C],l=b.getAttribute("name"),"checkbox"==b.type?c[l]=b.checked:void 0!=b.value&&(c[l]="textarea"==b.type||"word_filter"==l||"word_exclude"==l?encodeURIComponent(b.value):b.value));document.getElementById("grw-builder-connection").value=
JSON.stringify({connections:a,options:c});a.length&&(a=a[0],window.grw_title.value||(window.grw_title.value=a.name),grw_feed_save_ajax())}
function grw_deserialize_connections(a,c,b){var d=b.conns,h=d.options;if(Array.isArray(d.connections))d=d.connections;else{var f=[];if(Array.isArray(d.google)){for(var e=0;e<d.google.length;e++)d.google[e].platform="google";f=f.concat(d.google)}if(Array.isArray(d.facebook)){for(e=0;e<d.facebook.length;e++)d.facebook[e].platform="facebook";f=f.concat(d.facebook)}if(Array.isArray(d.yelp)){for(e=0;e<d.yelp.length;e++)d.yelp[e].platform="yelp";f=f.concat(d.yelp)}d=f}f=c.querySelector(".grw-builder-platforms");
for(e=0;e<d.length;e++)grw_connection_add(a,f,d[e],b.authcode,!0,!0);for(var l in h)Object.prototype.hasOwnProperty.call(h,l)&&(a=c.querySelector('input[name="'+l+'"],select[name="'+l+'"],textarea[name="'+l+'"]'))&&(b=a.getAttribute("name"),"boolean"===typeof h[l]?a.checked=h[l]:(a.value="textarea"==a.type||"word_filter"==b||"word_exclude"==b?decodeURIComponent(h[l]):h[l],-1<l.indexOf("_photo")&&a.value&&(a.parentNode.querySelector("img").src=a.value)))}
function grw_upload_photo(a,c,b){c||(c=wp.media.frames.file_frame=wp.media({title:jQuery(this).data("uploader_title"),button:{text:jQuery(this).data("uploader_button_text")},multiple:!1}),c.on("select",function(){var d=c.state().get("selection").first().toJSON();grw_change_photo(a,d.url);b&&b(d.url)}));c.open()}function grw_change_photo(a,c){var b=jQuery(".grw-connect-photo-hidden",a);a=jQuery(".grw-connect-photo",a);b.val(c);a.attr("src",c);a.show();grw_serialize_connections()}
function grw_popup(a,c,b,d){function h(){l&&0==l.closed?setTimeout(h,100):d()}var f=f||screen.height/2-b/2,e=e||screen.width/2-c/2,l=window.open(a,"","location=1,status=1,resizable=yes,width="+c+",height="+b+",top="+f+",left="+e);setTimeout(h,100)}function grw_randstr(a){for(var c="",b=0;b<a;b++)c+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(Math.floor(62*Math.random()));return c}function grw_is_hidden(a){return null===a.offsetParent}
function grw_capitalize(a){return a.charAt(0).toUpperCase()+a.slice(1)}function grw_lang(a,c){for(var b="",d=0;d<GRW_LANGS.length;d++)b+='<option value="'+GRW_LANGS[d][0]+'"'+(c==GRW_LANGS[d][0]?' selected="selected"':"")+">"+GRW_LANGS[d][1]+"</option>";return'<select class="grw-connect-lang" name="lang"><option value=""'+(c?"":' selected="selected"')+">"+a+"</option>"+b+"</select>"};
