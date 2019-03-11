// const opcodes = require('./Opcodes');
// const memory = require('./memory');
//import opcodes from './Opcodes'
import MMU from './memory.js';
import opcodes from './Opcodes.js';




document.getElementById('iterator').style.visibility = 'hidden';

class Register_8 {
  constructor(content) {
    this.value = new Uint8Array(1);
    this.value[0] = content;
  }

  getValue() {
    return this.value[0];
  }

  setValue(a) {
    this.value[0] = a;
  }

  addValue(a) {
    this.value[0]+=a;
  }
}

class Register_16 extends Register_8 {
  constructor(content) {
    super(content);
    this.value = new Uint16Array(1);
    this.value[0] = content;
  }
}

class Register_pair extends Register_16 {
  constructor(A, B) {
    let c = '00' + B.getValue().toString(16);
    let y = (A.getValue()<<8).toString(16);
    super(parseInt(y,16) + parseInt(c,16));
  }
}

class CPU_Z80 {
  constructor(init, MMU) {
    this.A = new Register_8(init),
    this.F = new Register_8(init),
    this.B = new Register_8(init),
    this.C = new Register_8(init),
    this.D = new Register_8(init),
    this.E = new Register_8(init),
    this.H = new Register_8(init),
    this.L = new Register_8(init);
    this.SP = new Register_16(init);
    this.PC = new Register_16(init);
    this._clock = {m:0, t:0};
    this.Operations = opcodes;

    //expose 64KB to CPU
    this.mem = MMU;
  }

  //Debuging purposes only
  //MemDUmp needed
  cpuDump() {
    console.log("+------------------+");
    console.log("| 15 ... 8|7 ... 0 |");
    console.log("+------------------+");
    //learn to space and center values
    console.log("| A:"+this.A.getValue().toString(16)+"| F:"+ this.F.getValue().toString(16)+" |");
    console.log("| B:"+this.B.getValue().toString(16)+"| C:"+ this.C.getValue().toString(16)+" |");
    console.log("| D:"+this.D.getValue().toString(16)+"| E:"+ this.E.getValue().toString(16)+" |");
    console.log("| H:"+this.H.getValue().toString(16)+"| L:"+ this.L.getValue().toString(16)+" |");
    console.log("| SP:"+this.SP.getValue().toString(16)+" |");
    console.log("| PC:"+this.PC.getValue().toString(16)+" |");
    console.log("| m_clock:"+ this._clock.m +" | t_clock:"+ this._clock.t+" |");
  }
  step() {
    console.log(this.mem.readByte(this.PC.getValue()));
    this.Operations[this.mem.readByte(this.PC.getValue())].exec(this);
    this.cpuDump();
  }
}
var memoryUnit = new MMU;
var core = new CPU_Z80(0, memoryUnit);
document.getElementById('iterator').addEventListener("click", function() {
  core.step();
});

core.A.setValue(0x00);
core.B.setValue(0x00);
core.E.setValue(0x00);
core.SP.setValue(0x0000);
core.PC.setValue(0x0000);
core.H.setValue(0x00);
core.L.setValue(0x00);
core.F.setValue(0x00);
//core.Operations[3].exec(core);
//core.Operations[8].exec(core,0xAAAA);
//core.A.addValue(-1*0x60);
core.Operations[175].exec(core);
//core.Operations[196].exec(core);
var fileByteArray = [];
document.querySelector('input').addEventListener('change', function() {

  var reader = new FileReader();

  reader.readAsArrayBuffer(this.files[0]);
  reader.onloadend = function (evt) {
    if (evt.target.readyState == FileReader.DONE) {
       var arrayBuffer = evt.target.result,
           array = new Uint8Array(arrayBuffer);
       for (var i = 0; i < array.length; i++) {
           fileByteArray.push(array[i]);
        }
        fileByteArray.forEach((x, index) => core.mem.writeByte(index,x));
        console.log(core.mem.readByte(3).toString(16));
        //step through
        document.getElementById('iterator').style.visibility = 'visible';
    }
}
}, false);





//console.log(memoryUnit.readByte(0x110E).toString(16));
// //console.log(0x3FFF);
