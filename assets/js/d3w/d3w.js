var d3w = {};

//регулярки
d3w.regexp = {};
d3w.regexp.month = {};
d3w.regexp.month.en2ru = 'ЯнвJan ФевFeb МарMar АпрApr МайMay ИюнJun ИюлJul АвгAug СенSep ОктOct НояNov ДекDec';
d3w.regexp.month.en2ruDo = function(inp) {
  return inp.replace(/[a-zA-Z]+/,d3w.regexp.month.en2ru.match('[а-яА-Я]+(?='+inp.match(/[a-zA-Z]+/)+')'));
};



d3w.types = {
  line: 0,
  stakedbars: 1,
  groupedbars: 2,
  diagramRound: 1
};



d3w.axis = {};
d3w.axis.time = {};

//Функция, генерящая набор осей для прокручивания только 1 даты с 1 универсальной осью (ввторая ось отображается ниже)
// d3w.axis.time.quantumSingleDateScrolled = function(scale, axisOrient, intervalType, daysCount, ticksCount, startDate, formatFunction) {
d3w.axis.time.quantumSingleDateScrolled = function(obj,dataset,axis) {
  var daysCount,
      datesDomain,
      step,
      ticks = obj.meta.horisontalTicksCount,
      tickValues = [],
      timeTickFormat,
      startDate = d3.min(obj.meta.allDates);

  obj.meta.axis.timeTickFormat = function(d) {
    return d3w.regexp.month.en2ruDo(
      d3.time.format("%d %b").call(
        null,
        d3.time.day.offset(startDate, -d)) 
      ); 
    };

  timeTickFormat = obj.meta.axis.timeTickFormat;

  //общее число дней в наших данных
  //мы используем scale ordinal где каждому дню соответствует позиция
  daysCount = obj.meta.axis.daysCount = d3.time.days(d3.min(obj.meta.allDates), d3.max(obj.meta.allDates)).length + 1;
  datesDomain = obj.meta.axis.datesDomain = d3.range(daysCount);

  //создаём скейл
  scale = d3.scale.ordinal()
    .domain(datesDomain)
    .rangeRoundBands([obj.width, 0],.3);

  if (!("scales" in obj.meta.axis)) obj.meta.axis.scales = {};
  obj.meta.axis.scales[axis] = scale;
  obj.meta.axis.object = scale;

  //создаём оси
  // xAxises = d3w.axis.time.quantumSingleDateScrolled(
  //  svgCanvas.x,
  //  "bottom",
  //  "day",
  //  meta.daysCount,
  //  meta.horisontalTicksCount,
  //  meta.datesDomain[1],
  //  svgCanvas.timeTickFormat
  //  );


  //OLD CODE

  //шаг интервала (зависит от ширины контейнера в пикселях)
  step = Math.round(daysCount/ticks);
  if (step < 1) step = 1; //если шаг меньше 0, то шаг = 1

  var axises = [];

  //генерация 1 основной оси для шага 0
  for (var i = 0; i < daysCount; i += step) {
    tickValues.push(i);
  }

  axises[0] = d3.svg.axis()
    .scale(scale)
    .orient(obj.meta.axis.axisOrient[axis])
    .tickFormat(timeTickFormat)
    .tickValues(tickValues);
  //указание смещения в интервалах времени, к которому привязана ось
  axises[0].position = 0;

  //генерация осей с 1 тиком, используемых для каждого дня
  for (var i = 0; i < daysCount; i++) {
    if (i % step != 0) {
        axises[i] = d3.svg.axis()
          .scale(scale)
          .orient(obj.meta.axis.axisOrient[axis])
          .tickFormat(timeTickFormat)
          .tickSize(25)
          .tickValues([i]);
        axises[i].position = i;
    }
  };    

  //добавлям все созданные оси в массив
  if (!("objects" in obj.meta.axis)) obj.meta.axis.objects = {};
  obj.meta.axis.objects[axis] = axises;

  return axises;

};
d3w.axis.time.linearSingleDateScrolled = function(obj,dataset,axis) {

  var datesDomain, datesAxis =[], minutesInTick, timeTickFormat, daysCount, axises =[], data
      minDate = d3.min(obj.meta.allDates),
      maxDate = d3.max(obj.meta.allDates);

  daysCount = d3.time.days(minDate, maxDate).length + 1;

  //вычисление домена дат, числа минут в 1 тике для шкалы и массива дат, который будет отображаться на шкале
  datesDomain = obj.meta.axis.datesDomain = [
    minDate,
    maxDate
  ];

  timeTickFormat = obj.meta.axis.timeTickFormat = d3w.axis.util.time.timeTickFormat;

  minutesInTick = d3.time.minutes(datesDomain[0],datesDomain[1]).length / (obj.meta.horisontalTicksCount - 1);

  if (obj.meta.horisontalTicksCount < obj.meta.datumsCount.max) {
    //если позиций больше, чем надо тиков
    datesAxis.push(datesDomain[0]);
    var d = datesDomain[0];
    for (var i = 0; i < obj.meta.horisontalTicksCount-2; i++) {
      //добавляем дату в диапазон
      d = d3.time.minute.offset(d,minutesInTick);
      datesAxis.push(d);
    } 
    datesAxis.push(datesDomain[1]);
  } else {
    //если позиций меньше или равно — добавляем дату из каждой позиции в тики
    for (var dobjIndex in dataset) {
      for (var dataIndex in dataset[dobjIndex].data) {
        datesAxis.push(dataset[dobjIndex].data[dataIndex].x);
      }
    }
    //jquery way
    // $(dataset).each(function(i,dobj){
    //   $(dobj.data).each(function(i,datum){ datesAxis.push(datum.x); });
    // });
  }

  //создаём скейл
  scale = d3.time.scale()
    .range( obj.meta.axis.axisRanges[axis] )
    .domain( datesDomain );

  if (!("scales" in obj.meta.axis)) obj.meta.axis.scales = {};
  obj.meta.axis.scales[axis] = scale;
  obj.meta.axis.object = scale;

  //генерация основной оси
  axises[0] = d3.svg.axis()
    .scale(scale)
    .orient(obj.meta.axis.axisOrient[axis])
    .tickFormat(timeTickFormat)
    .tickValues(datesAxis);

  //указание смещения в интервалах времени, к которому привязана ось
  axises[0].position = 0;

  //генерация осей с 1 тиком, используемых для каждого дня
  for (var i = 1, day; i < daysCount-1; i++) {
        day = d3.time.day.offset(minDate,i);
        axises[i] = d3.svg.axis()
          .scale(scale)
          .orient(obj.meta.axis.axisOrient[axis])
          .tickFormat(timeTickFormat)
          .tickSize(25)
          .tickValues([day]);
        axises[i].position = day;

  };    

  //добавлям все созданные оси в массив
  if (!("objects" in obj.meta.axis)) obj.meta.axis.objects = {};
  obj.meta.axis.objects[axis] = axises;

  return axises;

};
d3w.axis.time.linear = function(obj,dataset,axis) {
  var datesDomain, datesAxis =[], minutesInTick, timeTickFormat;

  //вычисление домена дат, числа минут в 1 тике для шкалы и массива дат, который будет отображаться на шкале
  datesDomain = obj.meta.axis.datesDomain = [
    d3.min(obj.meta.allDates),
    d3.max(obj.meta.allDates)
  ];

  timeTickFormat = obj.meta.axis.timeTickFormat = d3w.axis.util.time.timeTickFormat;

  minutesInTick = d3.time.minutes(datesDomain[0],datesDomain[1]).length / (obj.meta.horisontalTicksCount - 1);

  if (obj.meta.horisontalTicksCount < obj.meta.datumsCount.max) {
    //если позиций больше, чем надо тиков
    datesAxis.push(datesDomain[0]);
    var d = datesDomain[0];
    for (var i = 0; i < obj.meta.horisontalTicksCount-2; i++) {
      //добавляем дату в диапазон
      d = d3.time.minute.offset(d,minutesInTick);
      datesAxis.push(d);
    } 
    datesAxis.push(datesDomain[1]);
  } else {
    //если позиций меньше или равно — добавляем дату из каждой позиции в тики
    // $(dataset).each(function(i,dobj){
    //   $(dobj.data).each(function(i,datum){ datesAxis.push(datum.x); });
    // });
    for (var datasetIndex in dataset) {
      for (var dataIndex in dataset[datasetIndex].data) {
        datesAxis.push( dataset[datasetIndex].data[dataIndex].x );
      }
    }
  }

  //создаём скейл
  scale = d3.time.scale()
    .range( obj.meta.axis.axisRanges[axis] )
    .domain( datesDomain );

  if (!("scales" in obj.meta.axis)) obj.meta.axis.scales = {};
  obj.meta.axis.scales[axis] = scale;
  obj.meta.axis.object = scale;

  if (!("objects" in obj.meta.axis)) obj.meta.axis.objects = {};
  obj.meta.axis.objects[axis] = d3.svg.axis()
    .scale(scale)
    .orient(obj.meta.axis.axisOrient[axis])
    .tickFormat(timeTickFormat)
    .tickValues(datesAxis);

}

d3w.axis.linear = function(obj,dataset,axis) {

  //создаём скейл
  scale = d3.scale.linear()
    .range( obj.meta.axis.axisRanges[axis] )
    .domain( [ obj.meta.minAndMax[axis].min, obj.meta.minAndMax[axis].max ] );

  if (!("scales" in obj.meta.axis)) obj.meta.axis.scales = {};
  obj.meta.axis.scales[axis] = scale;
  obj.meta.axis.object = scale;

  if (!("objects" in obj.meta.axis)) obj.meta.axis.objects = {};
  obj.meta.axis.objects[axis] = d3.svg.axis()
    .scale(scale)
    .orient(obj.meta.axis.axisOrient[axis])
    .ticks(obj.meta.verticalTicksCount);
}

//утилитарные функции для осей
d3w.axis.util = {
  axisExtra: function(axisTypeFunctionName) {
    if (axisTypeFunctionName == "quantumSingleDateScrolled" || axisTypeFunctionName == "linearSingleDateScrolled") return function(){ this.margin.bottom += 20 };
    else return false;
  },
  axisTypes : function(type) {
    if (type == d3w.types.line) {
        return {
          x:{
            "default" : d3w.axis.time.linear,
            "linear" : d3w.axis.time.linear,
            "linearSingleDateScrolled" : d3w.axis.time.linearSingleDateScrolled
          },
          y:{
            "default" : d3w.axis.linear
          }
        };
    } else if (type == d3w.types.stakedbars || type == d3w.types.groupedbars) {
      return {
        x:{
          "default" : d3w.axis.time.quantumSingleDateScrolled,
          "quantumStepped" : d3w.axis.time.quantumStepped,
          "quantumSingleDateScrolled" : d3w.axis.time.quantumSingleDateScrolled,
        },
        y:{
          "default" : d3w.axis.linear
        }
      };
      
    } else if (type == d3w.types.diagramRound) {
      return null;
    }
  },
  meta : {
    calculate : {
      recatangularAxises : function(obj, dataset) {
        if (!("axis" in obj.meta)) obj.meta.axis = {};
        obj.meta.axis.axisRanges = {
          x: [0,obj.width],
          y: [obj.height,0]
        }
        obj.meta.axis.axisOrient = {
          x: "bottom",
          y: "left"
        }
        obj.meta.axis.axisTransform = {
          x: "translate(0," + obj.height + ")"
        }
        return d3w.axis.util.meta.calculate;
      }
    }

  },
  time : {
    timeTickFormat : function(d){ return d3w.regexp.month.en2ruDo( d3.time.format("%d %b").call(null,d) ); }
  },
  hideAllIAxises : function() {
    d3.select(this).selectAll(".x.axis")
      .filter(function(d){return d.position != 0;})
      .classed("d3w-iaxis",true)
      .style("display","none");
  }
};
d3w.axis.draw = function(obj,dataset) {
  var axises = d3w.axis.util.axisTypes(obj.options.type), typeFunction;

  for (axis in axises) {
    //доступные типы осей для этого типа графика
    typesFunctions = axises[axis];

    //есть ли настройки для данной оси?
    if (axis in obj.options.axises) {
      if (obj.options.axises[axis] in typesFunctions) {
        //такая функция есть, применяем её
        typeFunction = typesFunctions[ obj.options.axises[axis] ];
      } else {
        //функция указана в настройках, но её нет в доступных
        console.log("D3W: Unknown axis type!");
      }
    } else {
      //в настройках нет данной оси, применяем дефолтный вариант
      typeFunction = typesFunctions["default"];
    }

    //применяем функцию типа, котороя создаст нам объект
    if (typeof(typeFunction) == "function") {
      typeFunction(obj,dataset,axis);
    }

  }

  //создаём слой для осей
  axisesLayer = obj.svgCanvas.append("g").attr("class","d3w-axises");

  //отрисовываем все добавленные оси
  for (axisesKey in obj.meta.axis.objects) {
    
    var layer = axisesLayer.append("g");
    
    if (axisesKey in obj.meta.axis.axisTransform) layer.attr("transform", obj.meta.axis.axisTransform[axisesKey]);
    
    var axisObj = obj.meta.axis.objects[axisesKey];

    //рисуем ось или несколько
    if (axisObj instanceof Array) {
      for (var i = 0; i < axisObj.length; i++) if (i in axisObj)
        layer
          .append("g")
          .attr("class", "axis")
          .classed(axisesKey,true)
          .datum({"position":axisObj[i].position})
          .call(axisObj[i]);
    } else {
      layer
        .attr("class", "axis")
        .classed(axisesKey,true)
        .call(axisObj);
    }

  }

}
d3w.util = {
  // fillDatesInData: function(dataSet) {
  //   var allDates = d3.set(), dataObj, dataIndex, individualDatesSets = [], min, max;
    
  //   for (var i = 0; i < dataSet.length; i++) {
  //     dataObj = dataSet[i];
  //     individualDatesSets[i] = d3.set();
  //     for (dataIndex in dataObj.data) {
  //       min = d3.min([ d3w.util.parseDate(dataObj.data[dataIndex].x) ])
  //       allDates.add( dataObj.data[dataIndex].x );
  //       individualDatesSets[i].add ( dataObj.data[dataIndex].x );
  //     }
  //   }
    
  //   for (var d = d3.min(allDates.values()); d3w.util.parseDate(d)

  //   for (var i = 0; i < dataSet.length; i++) {
  //     dataObj = dataSet[i];
  //     allDates.forEach(function(v){
  //       if (!individualDatesSets[i].has(v)) {
  //         dataObj.data.push({y:0,x:v});
  //       }
  //     });
  //   }  

  //   return dataSet;
  // }
};
d3w.util.parseOptions = function(rawOptions) {

  /*
  * Целостность
  */

  //тип графика
  if ('type' in rawOptions) {
    if (rawOptions.type in d3w.types) {
      rawOptions.type = d3w.types[rawOptions.type];
    } else {
      console.log("D3W: Unknown chart type.");
      return false;
    }
  } else {
    rawOptions.type = d3w.types.line;
  }

  //оси графика
  if (!("axises" in rawOptions)) { 
    rawOptions.axises = {};
  } else {
    if (!("x" in rawOptions.axises)) {
      //в настройках нет параметров оси x
      rawOptions.axises
    }
  }

  //контейнер
  if (!('canvas' in rawOptions)) return false;

  if (!('height' in rawOptions)) {
    rawOptions.height = 200;
  } else {
    rawOptions.height = parseInt(rawOptions.height);
  }

  //отступы контейнера
  if (!('margin' in rawOptions)) {
    rawOptions.margin = {top: 20, right: 20, bottom: 30, left: 50};
  } else {
    if (!('top' in rawOptions.margin) || !('right' in rawOptions.margin) || !('bottom' in rawOptions.margin) || !('left' in rawOptions.margin)) rawOptions.margin = {top: 20, right: 20, bottom: 30, left: 50};
  }

  /*
  * Костыли
  */

  //обработка опций, в зависимости от типа оси
  //функция d3w.axis.util.axisExtra предоставит нужный коллбек или вернёт false,
  //если для такого типа оси модифицировать ничего не надо
  if ("x" in rawOptions.axises && d3w.axis.util.axisExtra(rawOptions.axises.x))
    d3w.axis.util.axisExtra(rawOptions.axises.x).call(rawOptions);

  return rawOptions;

}
//функция для парсинга дат
d3w.util.parseDate = d3.time.format("%d.%m.%Y").parse;






d3w.util.d3wGraph = {};
d3w.util.d3wGraph.make = function(options) {

  var d3wGraph = {};
  d3wGraph.options = options;
  d3wGraph.canvasElement = options.canvas;
  d3wGraph.canvasElementSelection = d3.select(d3wGraph.canvasElement).classed("d3w-chart",true);

  d3wGraph.heightCanvas = options.height;
  d3wGraph.widthCanvas = d3wGraph.canvasElement.scrollWidth;

  d3wGraph.width = d3wGraph.widthCanvas - options.margin.left - options.margin.right,
  d3wGraph.height = d3wGraph.heightCanvas - options.margin.top - options.margin.bottom;

  //инициализируем основное svg-полотно
  d3wGraph.svgCanvas = d3wGraph.canvasElementSelection.append("div").attr("class","d3w-wrapper").append("svg")
    .attr("width", d3wGraph.width + options.margin.left + options.margin.right)
    .attr("height", d3wGraph.height + options.margin.top + options.margin.bottom)
    .append("g")
    .attr("transform", "translate(" + options.margin.left + "," + options.margin.top + ")");

  //раздел для информации, необходимой для построения графика
  d3wGraph.meta = {};

  //refactor: переместиь туда, где считаются оси
  //количество горизонтальных тиков
    d3wGraph.meta.horisontalTickWidth = 40;
    d3wGraph.meta.horisontalTicksCount = Math.round(d3wGraph.width/(  d3wGraph.meta.horisontalTickWidth +   d3wGraph.meta.horisontalTickWidth/2));
  //количество вертикальных тиков
    d3wGraph.meta.verticalTickHeight = 15;
    d3wGraph.meta.verticalTicksCount = Math.round(d3wGraph.height/(  d3wGraph.meta.verticalTickHeight +   d3wGraph.meta.verticalTickHeight/2.5));

  return d3wGraph;

}

d3w.util.d3wGraph.meta = {};
d3w.util.d3wGraph.meta.calculate = function(obj, dataset) {
  var type = obj.options.type;
  if (type == d3w.types.line) {
    //линейный график
    d3w.util.d3wGraph.meta.calculate
      .datumsCount(obj,dataset)
      .collectAllDates(obj,dataset)
      .minAndMax(obj,dataset);
    d3w.axis.util.meta.calculate
      .recatangularAxises(obj,dataset);
  } else if (type == d3w.types.stakedbars) {
    //стекедбары
    d3w.util.d3wGraph.meta.calculate
      .simultaneousSums(obj,dataset)
      .collectAllDates(obj,dataset)
      .minAndMax(obj,dataset);

    d3w.axis.util.meta.calculate
      .recatangularAxises(obj,dataset);
  } else if (type == d3w.types.groupedbars) {
    //групедбары
    d3w.util.d3wGraph.meta.calculate
      .collectAllDates(obj,dataset)
      .minAndMax(obj,dataset)   ;

    d3w.axis.util.meta.calculate
      .recatangularAxises(obj,dataset);
  }
};

//создаёт уникальный массив всех неповторящихся дат
//заодно парсим даты
d3w.util.d3wGraph.meta.calculate.collectAllDates = function(obj, dataset) {
  var data;
  obj.meta.allDates = [];
  for (var index in dataset) {
    for(var dataIndex in dataset[index].data) {
      data = dataset[index].data[dataIndex];
      obj.meta.allDates.push(data.x = d3w.util.parseDate(data.x));
    }
  }
  //jquery way
  // $(dataset).each(function(i,d){
  //   $(d.data).each(function(i,d){obj.meta.allDates.push(d.x = d3w.util.parseDate(d.x));});
  // });
  //обеспечиваем уникальность набора дат
    //obj.meta.allDates = $.unique( meta.allDates );
  obj.meta.allDates = d3.scale.ordinal().domain(obj.meta.allDates).domain();
  return d3w.util.d3wGraph.meta.calculate;
};

//считает общий минимум и максимум по всем наборам
d3w.util.d3wGraph.meta.calculate.minAndMax = function(obj, dataset) {

  //dependency
  d3w.util.d3wGraph.meta.calculate.minAndMax.dataset(obj, dataset);

  obj.meta.minAndMax = {
    x: {
      min: d3.min(dataset, function(d){
        return d.meta.minAndMax.x.min;
      }),
      max: d3.max(dataset, function(d){
        return d.meta.minAndMax.x.max;
      })
    },
    y: {
      min: d3.min(dataset, function(d){
        return d.meta.minAndMax.y.min;
      }),
      max: d3.max(dataset, function(d){
        return d.meta.minAndMax.y.max;
      })
    }
  }
  return d3w.util.d3wGraph.meta.calculate;
};

  //считает для каждого набора данных его минимум и максимум по значениям и датам
  d3w.util.d3wGraph.meta.calculate.minAndMax.dataset = function(obj, dataset) {
    for (var i = 0, d; i < dataset.length; i++) {
      d = dataset[i];
      if (!('meta' in d)) d.meta = {};
      d.meta.minAndMax = {
          y: {
            min: d3.min(d.data, function(d) { return d.y; }),
            max: d3.max(d.data, function(d) { return d.y; })
          },
          x: {
            min: d3.min(d.data, function(d) { return d.x; }),
            max: d3.max(d.data, function(d) { return d.x; })
          } 
        };
    };
  return d3w.util.d3wGraph.meta.calculate;
  };

//считает для каждого набора данных его минимум и максимум по значениям и датам
d3w.util.d3wGraph.meta.calculate.datasetClasses = function(obj, dataset) {
  for (var i = 0, d; i < dataset.length; i++) {
    d = dataset[i];
    if (!('meta' in d)) d.meta = {};
    d.meta.minAndMax = {
        y: {
          min: d3.min(d.data, function(d) { return d.y; }),
          max: d3.max(d.data, function(d) { return d.y; })
        },
        x: {
          min: d3.min(d.data, function(d) { return d.x; }),
          max: d3.max(d.data, function(d) { return d.x; })
        } 
      };
  };
return d3w.util.d3wGraph.meta.calculate;
};

//считает для всего набора кумулятивные дновременные по датам суммы (чтобы определить реальный макмум суммы значений)
d3w.util.d3wGraph.meta.calculate.simultaneousSums = function(obj, dataset) {
  //массив сумм значений (для стекедбаров)
  obj.meta.simultaneousSums = [];

  d3.map(dataset).forEach(function(i,d){
    d3.map(d.data).forEach(function(i,d){
      if (i in meta.simultaneousSums) meta.simultaneousSums[i] += d.y;
      else meta.simultaneousSums[i] = d.y;
    });
  });

  obj.meta.simultaneousSumsMax = d3.max(obj.meta.simultaneousSums);
  obj.meta.simultaneousSumsMin = d3.min(obj.meta.simultaneousSums);
  return d3w.util.d3wGraph.meta.calculate;
};

d3w.util.d3wGraph.meta.calculate.datumsCount = function(obj, dataset) {
  obj.meta.datumsCount = {
    min: d3.min(dataset,function(d){ return d.data.length; }),
    max: d3.max(dataset,function(d){ return d.data.length; })
  }
  return d3w.util.d3wGraph.meta.calculate;
};







d3w.chart = function(dataset, options) {
  var drawFunction, d3wGraph;

  console.log("D3W: d3w.chart INVOKED");
  //data
  if (typeof(dataset) == 'undefined') return false;

  //объект параметров
  if (!( options = d3w.util.parseOptions(options || {}) )) {
    console.log("D3W: OOPS! chart options error");
  };

  //создаём объект-график
  d3wGraph = d3w.util.d3wGraph.make(options);

  //подстчёт метаинформации
  d3w.util.d3wGraph.meta.calculate(d3wGraph,dataset);

  //рисование осей
  d3w.axis.draw(d3wGraph,dataset);

  //получим функцию на рисование графика и вызовем её
  d3w.chart.chartTypes(d3wGraph.options.type).call(null, d3wGraph, dataset);

  return d3wGraph;

}







d3w.chart.chartTypes = function(type) {
  switch (type) {
    case d3w.types.line:
      return d3w.chart.line;
    break;
    case d3w.types.stakedbars:
    break;
    case d3w.types.groupedbars:
      return d3w.chart.groupedbars;
    break;
    case d3w.types.diagramRound:
    break;
  }
}

d3w.chart.line = function(obj,dataset) {

  var x = obj.meta.axis.scales.x,
      y = obj.meta.axis.scales.y,
      line,
      chartGridRoot = obj.svgCanvas.append("g").attr("class","d3w-line-grid"),
      chartRoot = obj.svgCanvas.append("g").attr("class","chart d3w-line"),
      chartHoversRoot = obj.svgCanvas.append("g").attr("class","d3w-chart-hovers"),
      chart,
      dClass,
      hovers;

  //рисуем для всех наборов данных их линию
  for (dataObjIndex in dataset) {


    dobj = dataset[dataObjIndex];
    dClass = ("class" in dobj.options ? dobj.options.class : "");
    
    //создаём группу для набора данных
    chart = chartRoot
      .append("g")
      .attr("class","d3w-line__dataset d3w-showHide")
      .classed(dClass,true);

    //создаём группу для набора данных
    chartGrid = chartGridRoot
      .append("g")
      .attr("class","d3w-line__dataset-grid d3w-showHide")
      .classed(dClass,true);

    line = d3.svg.line()
      .x(function(d) { return x(d.x); })
      .y(function(d) { return y(d.y); })
      .interpolate("monotone");

    //рисование линии графика
    chart
      .append("path")
      .datum(dobj.data)
      .attr("class", "line")
      .classed(dClass,true)
      .attr("d", line);


    //создаём точки
    chart
      .selectAll(".dot")
      .data(dobj.data)
      .enter()
        .append("circle")
        .attr("class", "dot")
        .classed(dClass,true)        
        .attr("r", 1)
        .attr("cx", function(d) { return x(d.x); })
        .attr("cy", function(d) { return y(d.y); })
        .datum(function(d){ return {"class":dobj.options.class,"value":d.y,"date":d.x} });
      
    //вспомогательные линии
    chartGrid
      .selectAll(".d3w-l-crosshair")
      .data(dobj.data)
      .enter()
        .append("line")
        .attr("class","d3w-l-crosshair")
        .attr("x1", 1)
        .attr("x2", function(d) { return x(d.x)})
        .attr("y1", function(d) { return y(d.y)})
        .attr("y2", function(d) { return y(d.y)})
        .on("mouseenter", function(){ event.stopPropagation(); });

    chartGrid
      .selectAll(".d3w-l-crosshair-vert")
      .data(dobj.data)
      .enter()
       .append("line")
       .attr("class","d3w-l-crosshair d3w-l-crosshair-vert")
       .attr("x1", function(d) { return x(d.x)})
       .attr("x2", function(d) { return x(d.x)})
       .attr("y1", obj.height-1)
       .attr("y2", function(d) { return y(d.y)})
       .on("mouseenter", function(){ event.stopPropagation(); });

    //ховербары
    chartHoversRoot.selectAll(".d3w-hover")
      .data(dobj.data, function(d){ return d.x })
      .enter()
        .append("rect")
        .attr("class", "d3w-hover d3w-tooltip-observer");

    hovers = chartHoversRoot.selectAll(".d3w-hover");    
    hovers
      .attr("y",0)
      .attr("x", function(d,i) {

        // console.log(d);

        var prev, next;

        hovers.each(
          function(d,a){
            if (a == i-1) prev = d;;
          });
        hovers.each(
          function(d,a){
            if (a == i+1) next = d;;
          });

        p = x( typeof(prev) != 'undefined' ? prev.x : d.x );
        n = x( typeof(next) != 'undefined' ? next.x : d.x );
        c = x( d.x );
        //set width
        d3.select(this).attr("width", Math.abs((n - (n - c)/2) - (p + (c - p)/2)) );
        return (p + (c - p)/2);

      })
      .attr("height", obj.height)       
      .style("opacity","0")
      .each(function(d){
        if (!("observers" in this)) this.observers = [];
        this.observers.push({
          dots: chart.selectAll(".dot").filter(function(e){ return e.date == d.x; }),
          hiddens: chartGrid.selectAll(".d3w-l-crosshair").filter(function(e){ return e.x == d.x; })
        });
      })
      .on("mouseenter",function(d){
        var tooltip;
        for (var i = 0; i < this.observers.length; i++) {
          this.observers[i].dots
            .transition()
            .duration(300)
            .ease('elastic')
            .attr('r', 4);
          this.observers[i].hiddens
            .style("display","block");
          if (tooltip = this.tooltip) {
            this.observers[i].dots.each(function(dotData){
              tooltip.updateSet
                .filter(function(e){
                  return e == dotData.class;
                })
                .text(dotData.value);
            });
          }
          
        }
      })
      .on("mouseleave",function(d){
        for (var i = 0; i < this.observers.length; i++) {
          this.observers[i].dots
            .transition()
            .duration(50)
            .ease('elastic')
            .attr('r', 1);
          this.observers[i].hiddens
            .style("display","none");
        }
      });
  }

  //добавляем тултип
  var tooltip = obj.tooltip = d3w.tooltip.add(obj,dataset);

  //для заполнения полей
  chartHoversRoot.selectAll(".d3w-hover").each(function(){
    this.tooltip = tooltip;
  })

  //добавляем легенду
  obj.legend = d3w.legend.add(obj,dataset)

  //организуем скрывашки
  obj.hideShowToggle = function(dataClass){
    var result;
    this.canvasElementSelection.selectAll(".d3w-showHide." + dataClass)
      .each(function(d){
        if (d3.select(this).style("display") != "none") { d3.select(this).style("display","none"); result = -1; }
        else { d3.select(this).style("display","block"); result = 1; }
      });
      return result;
  }

  d3w.legend.extendAddShowHideToggles(obj.legend,dataset);

  //если у нас мультиосевая система
  if (obj.options.axises.x == "linearSingleDateScrolled") {
      //скрываем ненужные оси
      d3w.axis.util.hideAllIAxises.call(obj.svgCanvas.node());

      obj.svgCanvas
        .on("mouseleave.axis", d3w.axis.util.hideAllIAxises);
      
      hovers
        .on("mouseenter.iaxis", function(d) {
          //покажем нужную ось
          obj.svgCanvas.selectAll(".x.axis")
          .style("display","none")
          .filter(function(ad){
            return ad.position == 0 || (d3.time.days(ad.position,d.x) == 0 && d3.time.days(d.x,ad.position) == 0);
          })
          .style("display","block");
        });
  }

};

d3w.chart.groupedbars = function(obj,dataset) {

  var x = obj.meta.axis.scales.x,
      y = obj.meta.axis.scales.y,
      line,
      chartGridRoot = obj.svgCanvas.append("g").attr("class","d3w-groupedbars-grid"),
      chartRoot = obj.svgCanvas.append("g").attr("class","chart d3w-groupedbars"),
      chartHoversRoot = obj.svgCanvas.append("g").attr("class","d3w-chart-hovers"),
      chart,
      dClass,
      hovers,
      barWidth,
      barOffset,
      xClosure,
      yClosure;

  //ширина колонки
  barWidth = x.rangeBand()/dataset.length;
  obj.meta.stakedbars = { "barWidth" : barWidth };

  //рисуем для всех наборов данных их линию
  for (dataObjIndex in dataset) {

    dobj = dataset[dataObjIndex];
    dClass = ("class" in dobj.options ? dobj.options.class : "");

    barOffset = barWidth * dataObjIndex;

    xClosure = function(d) {
      return x(d3.time.days(d.x,d3.max(obj.meta.allDates)).length) + barOffset;
    };
    yClosure = function(d) {
      return y(d.y) - 1;
    };

    //создаём группу для набора данных
    chart = chartRoot
      .append("g")
      .attr("class","d3w-groupedbars__dataset d3w-showHide")
      .classed(dClass,true);

    //создаём группу для набора данных
    chartGrid = chartGridRoot
      .append("g")
      .attr("class","d3w-groupedbars__dataset-grid d3w-showHide")
      .classed(dClass,true);

    //рисование столбиков
    chart
      .selectAll(".rect")
      .data(dobj.data.reverse())
      .enter()
        .append("rect")
        .attr("x", xClosure)
        .attr("y", yClosure)
        .attr("height", function(d) { return obj.height - y(d.y); })
        .attr("width", barWidth )
        .attr("class", "rect")
        .classed(dClass,true)
        .each(function(rd){
          rd.class = dClass;
          d3.select(this).datum(rd);
        });

    //вспомогательные линии
    chartGrid
      .selectAll(".d3w-l-crosshair")
      .data(dobj.data.reverse())
      .enter()
        .append("line")
        .attr("class","d3w-l-crosshair")
        .attr("x1", 1)
        .attr("x2", xClosure)
        .attr("y1", yClosure)
        .attr("y2", yClosure)
        .on("mouseenter", function(){
          event.stopPropagation();
        });

    //ховербары
    // chartHoversRoot.selectAll(".d3w-hover")
    //   .data(dobj.data.reverse(), function(d){ return d.x })
    //   .enter()
    //     .append("rect")
    //     .attr("class", "d3w-hover d3w-tooltip-observer");

    //ховербары
    chartHoversRoot.selectAll(".d3w-hover")
      .data(dobj.data.reverse(), function(d){ return d.x })
      .enter()
        .append("rect")
        .attr("class","d3w-hover d3w-tooltip-observer");
        
    hovers = chartHoversRoot.selectAll(".d3w-hover");    
    hovers
      .attr("x", function(d) { return x(d3.time.days(d.x,d3.max(obj.meta.allDates)).length); })
      .attr("y", 0)
      .attr("height", obj.height)
      .attr("width", x.rangeBand()*(10/8) )
      .style("opacity","0")
      .each(function(d){
        if (!("observers" in this)) this.observers = [];
        this.observers.push({
          hiddens: chartGrid.selectAll(".d3w-l-crosshair").filter(function(e){ return e.x == d.x; }),
          rects: chart.selectAll(".rect").filter(function(e){ return e.x == d.x; })
        });
      })
      .on("mouseenter",function(d){
        var tooltip;
        for (var i = 0; i < this.observers.length; i++) {
          this.observers[i].hiddens
            .style("display","block");
          if (tooltip = this.tooltip) {
            this.observers[i].rects.each(function(rectData){
              tooltip.updateSet
                .filter(function(e){
                  return e == rectData.class;
                })
                .text(rectData.y);
            });
          }
          
        }
        //покажем нужную ось
        obj.svgCanvas.selectAll(".x.axis")
          .style("display","none")
          .filter(function(ad){
            return ad.position == d3.time.days(d.x,d3.max(obj.meta.allDates)).length || ad.position == 0;
          })
          .style("display","block");
      })
      .on("mouseleave",function(d){
        for (var i = 0; i < this.observers.length; i++) {
          this.observers[i].hiddens
            .style("display","none");
        }
      });
  }


  //добавляем тултип
  var tooltip = obj.tooltip = d3w.tooltip.add(obj,dataset);

  //для заполнения полей
  chartHoversRoot.selectAll(".d3w-hover").each(function(){
    this.tooltip = tooltip;
  })

  //добавляем легенду
  obj.legend = d3w.legend.add(obj,dataset)

  //организуем скрывашки
  obj.hideShowToggle = function(dataClass){
    var result;
    this.canvasElementSelection.selectAll(".d3w-showHide." + dataClass)
      .each(function(d){
        if (d3.select(this).style("display") != "none") { d3.select(this).style("display","none"); result = -1; }
        else { d3.select(this).style("display","block"); result = 1; }
      });
      return result;
  }

  d3w.legend.extendAddShowHideToggles(obj.legend,dataset);

  //скрываем ненужные оси
  d3w.axis.util.hideAllIAxises.call(obj.svgCanvas.node());

  obj.svgCanvas
    .on("mouseleave.axis", d3w.axis.util.hideAllIAxises);

};





d3w.legend = {
  add: function(obj,dataset) {
    var legendObj = {};

    legendObj.element = obj.canvasElementSelection.insert("div",":first-child")
        .attr("class","d3w-legend");

    legendObj.element.selectAll(".d3w-legend__datasubset")
      .data(dataset, function(d) { return d.options.class; })
      .enter()
      .append("div")
        .attr("class","d3w-legend__datasubset");

    legendObj.element.selectAll(".d3w-legend__datasubset")
      .append("span")
      .attr("class","d3w-legend__datasubset-caption")
      .text(function(d){ return d.options.caption; });

    legendObj.element.selectAll(".d3w-legend__datasubset")
      .append("span")
      .attr("class","d3w-legend__datasubset-mark")
      .datum(function(d){ return d.options.class; })
      .append("svg")
      .append("circle")
      .attr("class",function(d){ return d + " circle"; })
      .attr("r","5")
      .attr("cx","5")
      .attr("cy","5");

    legendObj.element.selectAll(".d3w-legend__datasubset")
      .sort(function(a,b){
        if (a.options.class < b.options.class) return -1;
        else if (a.options.class >= b.options.class) return 1;
      })
      .order();

    legendObj.d3wGraph = obj;

    return legendObj;
    
  },
  //для использования, график должен иметь метод hideShowToggle
  extendAddShowHideToggles: function(legendObj,dataset) {
    if (!("hideShowToggle" in legendObj.d3wGraph)) return false;
    legendObj.element.selectAll(".d3w-legend__datasubset")
      .data(dataset, function(d) { return d.options.class; })
      .on("click",function(d){
            if (legendObj.d3wGraph.hideShowToggle.call(legendObj.d3wGraph,d.options.class) == -1) 
              d3.select(this).classed("d3w-js-muted",true);
            else
              d3.select(this).classed("d3w-js-muted",false);
          });
  }
}

d3w.tooltip = {
  //для привязки элементов внутри графика к объекту, задайте им класс d3w-tooltip-observer
  add: function(obj,dataset) {
    //добавляем плавающий тултип
    var tooltipObj = {},
        tooltip = obj.canvasElementSelection.select(".d3w-wrapper").append("div")
        .attr("class","d3w-tooltip"),
        tooltipDiv = tooltip.node(),
        overflow;

    obj.canvasElementSelection.select(".d3w-tooltip").selectAll(".d3w-tooltip__datasubset")
      .data(dataset, function(d) { return d.options.class; })
      .enter()
      .append("div")
      .sort(function(a,b){
        if (a.options.class < b.options.class) return -1;
        else if (a.options.class >= b.options.class) return 1;
      })
      .order()
        .attr("class",function(d){ return "d3w-tooltip__datasubset d3w-showHide " + d.options.class; });

    obj.canvasElementSelection.selectAll(".d3w-tooltip__datasubset")
      .append("span")
      .attr("class","d3w-tooltip__datasubset-caption")
      .text(function(d){ return d.options.caption; });

    obj.canvasElementSelection.selectAll(".d3w-tooltip__datasubset")
      .append("span")
      .attr("class","d3w-tooltip__datasubset-value")
      .datum(function(d){ return d.options.class; });

    //посчитаем доступное пространство
    tooltip.style("visibility","hidden").style("display","block");

    overflow = tooltipDiv.scrollHeight - ((obj.height/2) - 10);
    if (overflow < 0) overflow = 0;

    height = tooltipDiv.scrollHeight;

    v = obj.options.margin.top

    tooltipObj.scaleTop = d3.scale.linear()
      .range([10+v, 10+v, obj.height/2 - overflow+v])
      .domain([10, 10, obj.height/2]);

    tooltipObj.scaleBot = d3.scale.linear()
      .range([obj.height/2 + overflow - height+v, obj.height-10 - height+v, obj.height-10 - height+v])
      .domain([obj.height/2, obj.height-10, obj.height]);

    tooltip.style("visibility","visible").style("display","");


    obj.svgCanvas
      .on("mouseenter",function(){
        obj.canvasElementSelection.selectAll(".d3w-tooltip__datasubset-value")
          .classed("d3w-tooltip__datasubset-value_is_active",true);
        obj.canvasElementSelection.selectAll(".d3w-tooltip")
          .style("display","block");
      })
      .on("mouseleave",function(){
        obj.canvasElementSelection.selectAll(".d3w-tooltip__datasubset-value")
          .classed("d3w-tooltip__datasubset-value_is_active",false); 
        obj.canvasElementSelection.selectAll(".d3w-tooltip")
          .style("display","none");
      })
      .on("mousemove.tooltipLeft", function(d) {
        var x = d3.event.offsetX - obj.options.margin.left, 
        v = obj.options.margin.top,
        m = obj.options.margin.left;
        tooltipWidth = parseInt(obj.canvasElementSelection.select(".d3w-tooltip").node().scrollWidth);
        tooltip  
          .style("left", (x > obj.width/2 ? x - tooltipWidth - 20 + m : x + 20 + m) + "px");  
      })
      .on("mousemove", function(d) {
        var y = d3.event.offsetY - obj.options.margin.top;

        tooltipHeight = parseInt(obj.canvasElementSelection.select(".d3w-tooltip").style('height'));
        tooltip  
          .style("top", (y < obj.height/2 ? tooltipObj.scaleTop(y) : tooltipObj.scaleBot(y)) + "px");
          // .style("top", (y < obj.height/2 ? console.log("up") : console.log("down")) + "px");
            // console.log(d3.event.offsetY - obj.options.margin.top);   
            // console.log(obj.height);   
      });

      tooltipObj.updateSet = tooltip.selectAll(".d3w-tooltip__datasubset-value");

      return tooltipObj;

    }
}
