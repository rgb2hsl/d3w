d3w
===
Библиотека, использующая d3.js для построения графиков из наборов данных по времени.

Базовые инструкции по использованию
---------
1. Подключите [d3.js](http://d3js.org/)
2. Подключите d3w.js
3. В теле документа должен присутствовать элемент-контейнер, в котором библиотека будет отображать график.
4. Формат данных для построения графика и использование:

```javascript
var dataSets = [
  {
    'data': [
      {'y':1,  'x':'01.01.2015'},
      {'y':3,  'x':'02.01.2013'},
      {'y':2,  'x':'03.01.2013'},
      {'y':4,  'x':'04.01.2013'}
    ],
    'options':{
      'class':'css-class-for-data-set',
      'caption':'Название ряда данных'
    }
  }
]

var chart = d3w.chart(
    dataSets, //набор данных
    {
      canvas: d3.select('#container').node() //контейнер
    }
  );
```

Более подробно в [документации](https://github.com/ru-web-designer/d3w/wiki):
* [Описание API](https://github.com/ru-web-designer/d3w/wiki/API)
  * [d3w.chart](https://github.com/ru-web-designer/d3w/wiki/API#d3wchartdataset-options) — построение графиков

