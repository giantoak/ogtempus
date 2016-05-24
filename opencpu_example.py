from collections import OrderedDict
import simplejson as json
import pandas as pd
import requests
import tangelo


opencpu_url = 'https://public.opencpu.org/ocpu'


def _url_fmt(*args):
    """
    Joins given arguments into a url, stripping trailing slashes.
    """
    return '/'.join(map(lambda x: str(x).rstrip('/'), args))


def _r_list_fmt(x):
    """

    :param x: Some variable
    :returns: `str` -- variable formatted as r list
    """
    if isinstance(x, (list, set)):
        return 'c({})'.format(str(x)[1:-2])
    return 'c({})'.format(x)


def _r_ts_fmt(x, frequency=None):
    """

    :param x:
    :param frequency:
    :returns: `str` -- variable formatted as r time series
    """
    if frequency is None:
        return 'ts({})'.format(_r_list_fmt(x))

    return 'ts({}, frequency={})'.format(_r_list_fmt(x), frequency)


def _r_array_fmt(x, dim_one, dim_two):
    """

    :param x:
    :param int dim_one:
    :param int dim_two:
    :returns: `str` -- variables formatted as r array
    """
    return 'array({}, dim={})'.format(_r_list_fmt(x), _r_list_fmt([dim_one, dim_two]))

def get_time_series(date, value):
    """

    :param date:
    :param value:
    :returns: `str` --
    """
    ts = value
    dates = date
    data2 = 'ts(c('+str(ts)[1:-2]+'),frequency=12)' #need to post data as a time series object to stl
    url = 'https://public.opencpu.org/ocpu/library/stats/R/stl'
    params = {'x':data2,'s.window':4}
    r = requests.post(url,params)
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
    data2 = 'ts(c('+str(ts)[1:-2]+'),frequency=12)'  # need to post data as a time series object to stl
    url = '{}/library/stats/R/stl'.format(opencpu_url)
    params = {'x': data2, 's.window': 4}
    r = requests.post(url, params)
    # stl returns an object of class stl with three components:
    # * time.series - a multiple time series with columns seasonal, trend and remainder.
    # * weights     - the final robust weights (all one if fitting is not done robustly).
    # * $call       - the matched call ... etc
    # this object is not JSON-Serializable so we need to do another opencpu call to extract the time.series object

    result = r.text.split('\n')[0]  # gets the tmp storage address of the R object from the first request
    url2 = '{}/library/base/R/get/json'.format(opencpu_url)
    params2 = {'x': '"time.series"', 'pos': result[10:21]}  # using get to extract the time.series object
    r2 = requests.post(url2, params2)
    seasonal = map(lambda x: x[0], r2.json())
    trend = map(lambda x: x[1], r2.json())
    remainder = map(lambda x: x[2], r2.json())
    raw_ts = map(lambda x: {"date": x[0], "value": x[1]}, zip(dates, ts))
    seasonal_ts = map(lambda x: {"date": x[0], "value": x[1]}, zip(dates,  seasonal))
    remainder_ts = map(lambda x: {"date": x[0], "value": x[1]}, zip(dates, remainder))
    trend_ts = map(lambda x: {"date": x[0], "value": x[1]}, zip(dates, trend))
    stl = {'seasonal': seasonal_ts, 'trend': trend_ts, 'remainder': remainder_ts}
    return json.dumps(stl)


def breakout(date, value):
    """

    :param date:
    :param value:
    :returns: `` --
    """
    url = '{}/github/twitter/BreakoutDetection/R/breakout/json'.format(opencpu_url)
    data2 = 'c({})'.format(str(value)[1:-2])
    params = {'Z': data2}
    r = requests.post(url, params)
    return r.json()


def bcp(date, value):
    """

    :param date:
    :param value:
    :returns: `str` --
    """
    url = '{}/library/bcp/R/bcp/json'.format(opencpu_url)
    data2 = 'c({})'.format(str(value)[1:-2])
    params = {'x': data2}
    r = requests.post(url, params)

    res = r.text.split('\n')[0]
    url2 = '{}/library/base/R/get/json'.format(opencpu_url)
    params2 = {'x': '"posterior.prob"', 'pos': res[10:21]}
    r2 = requests.post(url2, params2)

    return json.dumps(map(lambda x: {"date": x[0], "value": x[1]}, zip(date, r2.json())))


def arima(date, value):
    """
    Run GO's version of the ARIMA algorithm on the suppied time series data.
    :param date:
    :param value:
    :returns: `str` --
    """
    ts = value
    dates = date
    data2 = 'ts(c({}))'.format(str(ts)[1:-2])
    url = '{}/github/giantoak/goarima/R/arima_all/json'.format(opencpu_url)
    params = {'x': data2}
    req = requests.post(url, params)
    # res = r.text.split('\n')[0]
    # url3 = 'http://public.opencpu.org/ocpu/library/stats/R/residuals/json'
    # x = {'object':res[10:21]}
    # r2 = requests.post(url3,x)
    # residuals = np.array(map(lambda x: x,r2.json()))
    # std_res = map(lambda x: x ,residuals/np.std(residuals))
    # return json.dumps(map(lambda x:{'date':x[0],'value':x[1]},zip(date,std_res)))
    data = req.json()
    data['dates'] = date
    return json.dumps(data)


def ci(date, value, bp):
    """

    :param date:
    :param value:
    :param bp:
    :returns: `str` --
    """
    url = '{}/github/google/CausalImpact/R/CausalImpact/json'.format(opencpu_url)
    ts = value
    length = len(value)
    dates = date
    data2 = 'ts(c({}))'.format(str(ts)[1:-2])
    params = {'data': data2, 'pre.period': 'c(1,{})'.format(bp), 'post.period': 'c({},{})'.format(bp+1, length)}
    r = requests.post(url, params)
    res = r.text.split('\n')[0]

    # url2 = 'https://public.opencpu.org/ocpu/library/base/R/get/'
    # params2 = {'x':'"series"','pos':res[10:21]}
    url2 = 'https://public.opencpu.org{}/json?force=true'.format(res)
    r2 = requests.get(url2)
    data = r2.json()
    data['date'] = dates
    return json.dumps({'date': data['date'], 'series': data['series']})


def anomaly(date, value):
    """

    :param date:
    :param value:
    :returns: `str` --
    """
    url = '{}/github/twitter/AnomalyDetection/R/AnomalyDetectionTs/json'.format(opencpu_url)
    x = map(lambda x: collections.OrderedDict({"timestamp": str(x[0]), "count": x[1]}), zip(date, value))
    data = {"x": map(lambda x: collections.OrderedDict([("timestamp", str(x[0])), ("count", x[1])]), zip(date, value))}
    headers = {'Content-Type': 'application/json'}
    r = requests.post(url, json.dumps(data), headers=headers)
    # data=r.json()
    # data['dates']=dates
    return r.json()


def mmpp(date, value):
    """
    Run GO's version of MMPP on the supplied time series data.
    We use all default values here.

    :param date:
    :param value:
    :returns: `` --
    """

    # Need to melt dates and values into a matrix
    # By default, we assume day - week breakdowns.
    # TODO: Test. As yet, totally untested, but maybe it works...

    df = pd.DataFrame({'date': [pd.to_datetime(x) for x in date], 'value': value})
    df['weekday'] = df['date'].apply(lambda x: x.weekday())
    crosstab = pd.pivot_table(df, 'value', 'date', 'weekday', aggfunc=sum).T
    crosstab_vals = ''.join(str(crosstab.values).replace('.', ',').replace('[', '').replace(']', '').split())
    data_str = 'array(c({}, dim=c({},{})'.format(crosstab_vals, crosstab.shape[1], crosstab.shape[0])
    url = '{}/github/giantoak/mmppr/R/sensorMMPP/json'.format(opencpu_url)
    params = {'N': data_str}
    r = requests.post(url, params)
    return r.json()


post_actions = {
    'get': get_time_series,
    'bo': breakout,
    'bcp': bcp,
    'arima': arima,
    'ci': ci,
    'anomaly': anomaly,
    'mmpp': mmpp
}


@tangelo.restful
def post(action, *args, **kwargs):
    """

    :param action:
    :param args:
    :param kwargs:
    :returns: `` --
    """
    # ibm=requests.get("https://www.quandl.com/api/v1/datasets/GOOG/NYSE_IBM.json?trim_start="+date1+"&trim_end
    # ="+date2+"'")
    post_data = json.loads(tangelo.request_body().read())

    def unknown(**kwargs):
        return tangelo.HTTPStatusCode(400, "invalid service call")

    # we now have a json object containing the seasonal, trend, and remainder components
    return post_actions.get(action, unknown)(**post_data)



"""with open('sample_data.json') as data_file:    
    data = json.load(data_file)

    test = data
    test = json.loads(bcp(test['date'], test['value']))
    
    remove = []
    length = len(test)
    for i in range(0, length):
        if test[i]['value'] == 0:
            remove.append(i)
            
    for i in range(0, len(remove)):
        test.pop(remove[i] - i)
    
    count = 0
    for value in test:
        if value['value'] == 0:
            value.pop()
            count += 1
            
    print count"""