import tangelo
import requests
import json
import cherrypy
import numpy as np
import urllib
import simplejson
import collections

def getTS(date,value):
	ts=value
	dates=date
	data2='ts(c('+str(ts)[1:-2]+'),frequency=12)' #need to post data as a time series object to stl
	url='https://public.opencpu.org/ocpu/library/stats/R/stl'
	params={'x':data2,'s.window':4}
	r=requests.post(url,params)
#stl returns an object of class stl with components 
#time.series a multiple time series with columns seasonal, trend and remainder.
#weights	the final robust weights (all one if fitting is not done robustly).
#$call	the matched call ... etc
#this object is not JSON-Serializable so we need to do another opencpu call to extract the time.series object

	result=r.text.split('\n')[0] #gets the tmp storage address of the R object from the first request
	url2='https://public.opencpu.org/ocpu/library/base/R/get/json'
	params2={'x':'"time.series"','pos':result[10:21]} #using get to extract the time.series object
	r2=requests.post(url2,params2)
	seasonal=map(lambda x: x[0],r2.json())
	trend=map(lambda x: x[1],r2.json())
	remainder=map(lambda x: x[2],r2.json())
	raw_ts=map(lambda x:{"date":x[0],"value":x[1]},zip(dates,ts))
	seasonal_ts=map(lambda x:{"date":x[0],"value":x[1]},zip(dates,seasonal))
	remainder_ts=map(lambda x:{"date":x[0],"value":x[1]},zip(dates,remainder))
	trend_ts=map(lambda x:{"date":x[0],"value":x[1]},zip(dates,trend))
	stl={'seasonal':seasonal_ts,'trend':trend_ts,'remainder':remainder_ts}
	return json.dumps(stl)

def breakout(date,value):
	url='https://public.opencpu.org/ocpu/github/twitter/BreakoutDetection/R/breakout/json'
	data2='c('+str(value)[1:-2]+')'
	params={'Z':data2}
	r=requests.post(url,params)
	return r.json()

def bcp(date,value):
	url='https://public.opencpu.org/ocpu/library/bcp/R/bcp/'
	data2='c('+str(value)[1:-2]+')'
	params={'x':data2}
	r=requests.post(url,params)
	res=r.text.split('\n')[0]
	url2='https://public.opencpu.org/ocpu/library/base/R/get/json'
	params2={'x':'"posterior.prob"','pos':res[10:21]}
	r2=requests.post(url2,params2)
	return json.dumps(map(lambda x: {"date":x[0],"value":x[1]},zip(date,r2.json())))
	
def arima(date,value):
	ts=value
	dates=date
	data2='ts(c('+str(ts)[1:-2]+'))'
	url='https://public.opencpu.org/ocpu/github/giantoak/goarima/R/arima_all/json'
	params={'x':data2}
	r=requests.post(url,params)
	#res=r.text.split('\n')[0]
	#url3='http://public.opencpu.org/ocpu/library/stats/R/residuals/json'
	#x={'object':res[10:21]}
	#r2=requests.post(url3,x)
	#residuals=np.array(map(lambda x: x,r2.json()))
	#std_res=map(lambda x: x ,residuals/np.std(residuals))
	#return json.dumps(map(lambda x:{'date':x[0],'value':x[1]},zip(date,std_res)))
	data=r.json()
	data['dates']=date
	return json.dumps(data)

def ci(date,value,bp):
	url='https://public.opencpu.org/ocpu/github/google/CausalImpact/R/CausalImpact'
	ts=value
	length=len(value)
	dates=date
	data2='ts(c('+str(ts)[1:-2]+'))'
	params={'data':data2,'pre.period':'c(1,'+str(bp)+')','post.period':'c('+str(bp+1)+','+str(length)+')'}
	r=requests.post(url,params)
	res=r.text.split('\n')[0]
	#url2='https://public.opencpu.org/ocpu/library/base/R/get/'
	#params2={'x':'"series"','pos':res[10:21]}
	url2='https://public.opencpu.org'+res+'/json?force=true'
	r2=requests.get(url2)
	data=r2.json()
	data['date']=dates
	return json.dumps({'date':data['date'],'series':data['series']})

def anomaly(date,value):
	url='https://public.opencpu.org/ocpu/github/twitter/AnomalyDetection/R/AnomalyDetectionTs/json'
	x=map(lambda x: collections.OrderedDict({"timestamp":str(x[0]),"count":x[1]}),zip(date,value))
	data={"x":map(lambda x: collections.OrderedDict([("timestamp",str(x[0])),("count",x[1])]),zip(date,value))}
	url='https://public.opencpu.org/ocpu/github/twitter/AnomalyDetection/R/AnomalyDetectionTs/json'
	headers = {'Content-Type': 'application/json'}
	r=requests.post(url,json.dumps(data),headers=headers)
	#data=r.json()
	#data['dates']=dates
	return r.json()





post_actions= {
	'get':getTS,
	'bo': breakout,
	'bcp': bcp,
	'arima': arima,
	'ci':ci,
	'anomaly':anomaly
}


@tangelo.restful
def post(action,*args,**kwargs):
	#ibm=requests.get("https://www.quandl.com/api/v1/datasets/GOOG/NYSE_IBM.json?trim_start="+date1+"&trim_end="+date2+"'")
	post_data=json.loads(tangelo.request_body().read())

	def unknown(**kwargs):
		return tangelo.HTTPStatusCode(400,"invalid service call")

	return post_actions.get(action,unknown)(**post_data) #we now have a json object containing the seasonal, trend, and remainder components




