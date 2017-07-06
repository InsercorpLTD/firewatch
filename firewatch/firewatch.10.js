/* firewatch object */
let firewatch = {
	'id':'firewatch_block',
	'dweet': null, 
	'ele': null,
	'image': false,
	'temp':'Fahrenheit',
	'charts': [],
	'data': [],
	'gauges':[],
	'gauge':{
		width:150, 
		height: 150
	},
	'toggle': 'enabled',
	'init':(function(options){
		if (options.id) firewatch.id = options.id;
		if (options.gauges) firewatch.gauges = options.gauges;
		if (options.gauge) firewatch.gauge = options.gauge;
		firewatch.setup();
	}),
	'setup':(function(){
		firewatch.ele = document.getElementById(firewatch.id);
		if (firewatch.ele){
			firewatch.ele.innerHTML = '<div style="width:100%;">'
					+'<span id="active-label" class="label label-success">Status: Online</span>'
				+'</div>'
				+'<div class="charts"></div>'
				+'<div class="image">'
					+'<a onclick="firewatch.camera_toggle();" class="button-1" title="Enable Webcam">Enable Webcam</a>'
				+'</div>';
			let ele = firewatch.ele.querySelector('.charts');
			for (var i = 0; i < firewatch.gauges.length; i++){
				let div = document.createElement('DIV'),
					span = document.createElement('SPAN'),
					label = document.createElement('SPAN');

				//div.style = 'display:inline-block;text-align:center';
				div.innerHTML = '<h1>'+firewatch.gauges[i][0]+'</h1>';
				console.log(firewatch.gauges[i][0]);
				span.style = 'text-align:center';
				span.id = 'chart_'+firewatch.gauges[i][0];
				span.class = 'chart';
				if (firewatch.gauges[i][0] == 'Temp')
					span.onclick = firewatch.temp_toggle;

				label.id = 'chart_label_'+firewatch.gauges[i][0];
				label.innerHTML = firewatch.gauges[i][3];

				if(ele){
					div.appendChild(span);
					div.appendChild(label);
					ele.appendChild(div);
				}
				firewatch.gauges[i][1].width = firewatch.gauge.width;
				firewatch.gauges[i][1].height = firewatch.gauge.height;
				firewatch.gauges[i][1].minorTicks = firewatch.gauge.minorTicks;

				let ranges = setRanges(firewatch);
				firewatch.gauges[i][1].greenFrom = ranges.range[i].greenFrom;
				firewatch.gauges[i][1].greenTo = ranges.range[i].greenTo;
				firewatch.gauges[i][1].redFrom = ranges.range[i].redFrom;
				firewatch.gauges[i][1].redTo = ranges.range[i].redTo;
				firewatch.gauges[i][1].yellowFrom = ranges.range[i].yellowFrom;
				firewatch.gauges[i][1].yellowTo = ranges.range[i].yellowTo;
			}
	  		google.charts.load('current', {'packages':['gauge']});
		  	google.charts.setOnLoadCallback(firewatch.setup_charts);
			/* listen for incoming firewatch data */
			dweetio.get_latest_dweet_for((firewatch.dweet||firewatch.id),firewatch.receive); 
			dweetio.listen_for((firewatch.dweet||firewatch.id),firewatch.receive); 
			
		}
	}),
	'setup_charts':(function(e){
		for (var i = 0; i < firewatch.gauges.length; i++) {
			firewatch.data[i] = google.visualization.arrayToDataTable(
				[['Label', 'Value'],
				[firewatch.gauges[i][2],0]]
			);
			firewatch.charts[i] = new google.visualization.Gauge(document.getElementById('chart_'+firewatch.gauges[i][0]));
			firewatch.charts[i].draw(firewatch.data[i], firewatch.gauges[i][1]);
		}
	}),
	'receive':(function(dweet){
		/* check if dweet content exists */
		if(dweet && dweet.content){
			let ele = firewatch.ele,
				html = '';
			// Removes the Probe is offline message if it exists
			let active = document.getElementById('active-label');
			if (active){ active.innerHTML = 'Status: Online'; active.className = 'label label-success'; }
			if(firewatch.toggle == 'disabled'){ 
				let img = firewatch.ele.querySelector('.image');
				if (img) img.innerHTML = '<a onclick="firewatch.camera_toggle();" class="button-1" title="Enable Webcam">Enable Webcam</a>';
				firewatch.toggle = 'enabled'; 
			}
			/* update the charts */
			for (var i = 0; i < firewatch.gauges.length; i++) {
				if(firewatch.data[i] && firewatch.charts[i]){
					if(dweet.content[firewatch.gauges[i][0]]){
						let lbl = firewatch.gauges[i][0],
							num = dweet.content[lbl],
							label = firewatch.gauges[i][3] + '<br/>',
							el = document.getElementById('chart_label_'+firewatch.gauges[i][0]);
						if (lbl == 'Temp') {
							if (firewatch.temp == 'Fahrenheit')
								num = firewatch.fahrenheit(num);
							label += num + ' ' + firewatch.temp;
						} else label += num + ' ' + firewatch.gauges[i][2];
				  		firewatch.data[i].setValue(0, 1, num);
				  		firewatch.charts[i].draw(firewatch.data[i], firewatch.gauges[i][1]);
						if (el) el.innerHTML = label

					}
				}
			}
			/* add the image stream to the div.image */
			if (firewatch.image && dweet.content.link){
				let img = firewatch.ele.querySelector('.image');
				if (img) img.innerHTML = '<a onclick="firewatch.camera_toggle_off();" class="button-1" title="Disable Webcam">Disable Webcam</a> <img src="'+dweet.content.link+'?action=stream" />';
				firewatch.image = false;
			}
			
		}else{
			let active = document.getElementById('active-label');
			if (active){ active.innerHTML = 'Status: Offline'; active.className = 'label label-default'; }
			let img = firewatch.ele.querySelector('.image');
			if (img) img.innerHTML = '<a onclick="return false;" class="button-1 disabled" title="Enable Webcam">Enable Webcam</a>';
			firewatch.toggle = 'disabled';
		}
	}),
	'fahrenheit':(function(degrees){ return Math.round(degrees * 9 / 5 + 32) }),
	'camera_toggle':(function(e){
		let img = firewatch.ele.querySelector('.image');
		if (img) img.innerHTML = '<a onclick="firewatch.camera_toggle_off();" class="button-1" title="Disable Webcam">Disable Webcam</a> <div>Loading...</div>';
		firewatch.image = true
	}),
	'camera_toggle_off':(function(e){
		let img = firewatch.ele.querySelector('.image');
		if (img) img.innerHTML = '<a onclick="firewatch.camera_toggle();" class="button-1" title="Enable Webcam">Enable Webcam</a>';
		firewatch.image = false;
	}),
	'temp_toggle':(function(e){
		if (firewatch.temp == 'Fahrenheit')
			firewatch.temp = 'Celsius';
		else firewatch.temp = 'Fahrenheit';
		for (var i = 0; i < firewatch.gauges.length; i++) {
			if (firewatch.gauges[i][0] == 'Temp'){
				firewatch.data[i].setValue(0,0,firewatch.temp);
				firewatch.charts[i].draw(firewatch.data[i], firewatch.gauges[i][1]);
				break;
			}
		}
	})
};

function setRanges(firewatch){
	let ranges = {
		'range': [{
			greenFrom:0,
			greenTo:90,
			yellowFrom:90,
			yellowTo: 100,
			redFrom: 100,
			redTo: firewatch.gauges[0][1].max
		},
		{
			greenFrom:0,
			greenTo:150,
			yellowFrom:150,
			yellowTo: 200,
			redFrom: 200,
			redTo: firewatch.gauges[1][1].max
		},
		{
			greenFrom: 100,
			greenTo: firewatch.gauges[2][1].max,
			yellowFrom: 10,
			yellowTo: 100,
			redFrom: 0,
			redTo: 10
		}]
	};
	return ranges;
}