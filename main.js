#!/usr/bin/nodejs

"use strict";

let gDebug = 0;

class Disease{
  constructor(waitdays, infectiousdays, symptomdays, infectionrate, nosymptomrate, heavysymptomrate){
    this.waitdays          = waitdays;
    this.infectiousdays    = infectiousdays;
    this.symptomdays       = symptomdays;
    this.infectionrate     = infectionrate;
    this.nosymptomrate     = nosymptomrate;
    this.heavysymptomrate  = heavysymptomrate;
    console.dir(this);
  }
}

class Person{
  constructor(id, x, y, resistant){
    this.id           = id;
    this.x            = x;
    this.y            = y;
    this.resistant    = resistant;
    this.infectedBy   = null;
    this.infected     = null;
    this.infectious   = null;
    this.symptom      = null;
    this.heavysymptom = false;
    this.cured        = null;
    this.contacts     = 0;
  }

  getId(){
    return(this.id);
  }

  setInfected(day, id, disease){
    this.infectedBy = id;
    this.infected   = day;
    this.infectious = this.infected     + disease.waitdays;
    if(Math.random()>=disease.nosymptomrate){
      this.heavysymptom = (Math.random() < disease.heavysymptomrate);
      this.symptom      = this.infectious + disease.infectiousdays;
      this.cured        = this.symptom    + disease.symptomdays;
    } else {
      this.symptom      = this.infectious + disease.symptomdays;
      this.cured        = this.infectious + disease.symptomdays;
    }
//  console.dir(this);
  }

  getResistant(){
    return(this.resistant);
  }

  canBeInfected(today){
    return(!this.resistant && !this.infected);
  }

  isInfectious (today){
    return(this.infectious<=today && today<this.symptom);
  }

  isIll(today){
    return(this.infected<=today && today<this.cured);
  }

  hasSymptom(today){
    return(this.symptom<=today && today<this.cured);
  }

  hasHeavySymptom(today){
    return(this.heavysymptom && this.symptom<=today && today<this.cured);
  }

  incContacts(){
    this.contacts ++;
  }

  dump(){
    let txt = "";
    txt = txt + " " + this.infected;
    txt = txt + " " + this.infectious;
    txt = txt + " " + this.heavysymptom;
    txt = txt + " " + this.symptom;
    txt = txt + " " + this.cured;
    txt = txt + " " + this.infectedBy
    txt = txt + " " + this.id;
    txt = txt + " " + this.contacts;
    txt = txt + " " + this.resistant;
    txt = txt + "\n";
    return(txt);
  }
}


class Country{
  constructor(xsize, ysize, period, resistantrate, distance, contacts){
    this.xsize    = xsize;
    this.ysize    = ysize;
    this.period   = period;
    this.distance = distance;
    this.contacts = contacts;
    this.country  = [];
    this.infected = [];
    this.status   = [];
  
    for(let i=0; i<=this.period; i++){
      this.status[i] = {
                        infected:     0,
                        infectious:   0,
                        heavysymptom: 0,
                        symptom:      0,
                        cured:        0
                       };
    }

    let nr = 1;
    for(let x=0; x<this.xsize; x++){
      this.country[x]=[];
      for(let y=0; y<this.ysize; y++){
        this.setPerson(x, y, new Person(nr, x,y, Math.random()<resistantrate));
        nr ++;
      }
    }
  }

  setInfected(day, infected){
    this.infected             = infected;
    this.status[day].infected = infected.length;
  }

  getInfected(){
    return(this.infected);
  }

  personInfecting(day, person, disease){
    let newInfected = [];
    if(person.isIll(day)){
      newInfected.push(person);
    }
    if(person.isInfectious(day)){
      this.status[day].infectious ++;
      for(let i=0; i<this.contacts; i++){
        if(Math.random()<disease.infectionrate){
          let x = person.x + (Math.random()*2 -1) * this.distance |0;
          let y = person.y + (Math.random()*2 -1) * this.distance |0;
          if((x>=0 && x<this.xsize) && (y>=0 && y<this.ysize)){
//        x = Math.max(Math.min(x, this.xsize-1),0);
//        y = Math.max(Math.min(y, this.ysize-1),0);
//        console.dir({x: x, y:y, px: person.x, py: person.y});
            let newPerson = this.getPerson(x, y);
            newPerson.incContacts();
            if(newPerson.canBeInfected(day)){
              this.status[day].infected ++;
              newPerson.setInfected(day, person.getId(), disease);
              this.setPerson(x, y, newPerson);
              newInfected.push(newPerson);
            }
//        } else{
//          console.log('Pos', x, y);
          }
        }
      }
    } else {
      if(person.hasSymptom(day)){
      if(person.hasHeavySymptom(day)){
          this.status[day].heavysymptom ++;
        } else {
          this.status[day].symptom ++;
        }
      } else {
        this.status[day].cured ++;
      }
    }
    return(newInfected);
  }

  calcInfections(day, disease){
    let newInfected = [];
    for(let person of this.infected){
      let pInfected = this.personInfecting(day, person, disease);
      for(let person of pInfected){
        newInfected.push(person);
      };
    };

    this.infected = newInfected;
    if(gDebug) { console.dir(infected); }
    return(this.infected);
  }

  setPerson(x,y, person){
    this.country[x][y] = person;
  }

  getPerson(x, y){
    return(this.country[x][y]);
  }

  dump(){
    let txt ="";
    for(let x=0; x<xSize; x++){
      for(let y=0; y<ySize; y++){
        txt = txt + this.country[x][y].dump();
      }
    }
    return(txt);
  }

  getStatus(day){
    return(this.status[day]);
  }
}

function generate(options){
  console.dir(options);
  let disease = new Disease(options.waitdays, options.infectiousdays, options.symptomdays, options.infectionrate/100.0, options.nosymptoms/100.0, options.heavysymptoms/100.0);
  let country = new Country(options.xsize, options.ysize, options.period, options.resistant/100.0, options.distance, options.contacts);

  let today  = 0;

  let infected =[];
  for(let i=0; i<options.initiallyinfected;){
    let x = Math.random() * options.xsize |0;
    let y = Math.random() * options.ysize |0;
    let person = country.getPerson(x, y);
    person.incContacts();
    if(person.canBeInfected()){
      person.setInfected(today, 0, disease);
      country.setPerson(x, y, person);
      infected.push(person);
      i++;
    }
  }

  country.setInfected(today, infected);
  while(today<options.period){
    today ++;
    let infections = country.calcInfections(today, disease);
    if(gDebug) {console.dir(infections);}
  }

  if(gDebug) {
    console.log(country.dump());
  }
  
  let data = [];
  console.log('day', 'infected', 'infectious', 'heavysymptom', 'symptom', 'cured');
  for(let i=0; i<=today; i++){
    let status = country.getStatus(i);
    data.push(status);
    console.log(i, status.infected, status.infectious, status.heavysymptom, status.symptom, status.cured);
  }

  return(data);
}
