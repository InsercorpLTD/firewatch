/* firewatch object */
let firewatch = {
	'id':'firewatch_block',
	'dweet': null, 
	'ele': null,
	'image': false,
	'charts': [],
	'data': [],
	'gauges':[],
	'gauge':{
		width:150, 
		height: 150
	},
	'init':(function(options){
		if (options.id) firewatch.id = options.id;
		if (options.gauges) firewatch.gauges = options.gauges;
		if (options.gauge) firewatch.gauge = options.gauge;
		firewatch.setup();
	}),
	'setup':(function(){
		firewatch.ele = document.getElementById(firewatch.id);
		if (firewatch.ele){
			firewatch.ele.innerHTML = '<div class="charts"></div><div class="image"></div>';
			let ele = firewatch.ele.querySelector('.charts');
			for (var i = 0; i < firewatch.gauges.length; i++){
				let span = document.createElement("SPAN");
				span.id = 'chart_'+i;
				span.class = 'chart';
				span.style = 'display:inline-block';
				if(ele)ele.appendChild(span);
				firewatch.gauges[i][1].width = firewatch.gauge.width;
				firewatch.gauges[i][1].height = firewatch.gauge.height;
				firewatch.gauges[i][1].minorTicks = firewatch.gauge.minorTicks;
				firewatch.gauges[i][1].redFrom = firewatch.gauges[i][1].max*.9;
				firewatch.gauges[i][1].redTo = firewatch.gauges[i][1].max;
				firewatch.gauges[i][1].yellowFrom = firewatch.gauges[i][1].max*.75;
				firewatch.gauges[i][1].yellowTo = firewatch.gauges[i][1].max*.9;
			}
	  		google.charts.load('current', {'packages':['gauge']});
		  	google.charts.setOnLoadCallback(firewatch.setup_charts);
			/* listen for incoming firewatch data */
			dweetio.listen_for((firewatch.dweet||firewatch.id),firewatch.receive); 
		}
	}),
	'setup_charts':(function(e){
		for (var i = 0; i < firewatch.gauges.length; i++) {
			firewatch.data[i] = google.visualization.arrayToDataTable(
				[['Label', 'Value'],
				[firewatch.gauges[i][0],0]]
			);
			firewatch.charts[i] = new google.visualization.Gauge(document.getElementById('chart_'+i));
			firewatch.charts[i].draw(firewatch.data[i], firewatch.gauges[i][1]);
		}
	}),
	'receive':(function(dweet){
		/* check if dweet content exists */
		if(dweet && dweet.content){
			let ele = firewatch.ele,
				html = '';
			/* update the charts */
			for (var i = 0; i < firewatch.gauges.length; i++) {
				if(firewatch.data[i] && firewatch.charts[i]){
					if(dweet.content[firewatch.gauges[i][0]]){
						let lbl = firewatch.gauges[i][0],
							num = dweet.content[lbl];
				  		firewatch.data[i].setValue(0, 1, dweet.content[lbl]);
				  		firewatch.charts[i].draw(firewatch.data[i], firewatch.gauges[i][1]);
					}
				}
			}
			/* add the image stream to the div.image */
			if (!firewatch.image && dweet.content.link){
				let img = ele.querySelector('.image');
				if (img) img.innerHTML = '<img src="'+dweet.content.link+'?action=stream" />';
				firewatch.image = true;
			}
		}
	})
};