const opcodes = require('./Opcodes');
const memory = require('./memory');
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
    this.Operations = opcodes.OP;

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
}

var memoryUnit = new memory.MMU;
var core = new CPU_Z80(0, memoryUnit);
core.A.setValue(0x00);
core.B.setValue(0xFF);
core.E.setValue(0xF0);
core.SP.setValue(0xFF1E);
core.PC.setValue(0x0000);
core.mem.writeByte(0x0001,0x0D);
core.mem.writeByte(0x77FF,0xAF);
core.H.setValue(0x77);
core.L.setValue(0xFF);
core.F.setValue(0x10);
core.mem.writeByte(0x0001,0xCB);
//core.Operations[3].exec(core);
//core.Operations[8].exec(core,0xAAAA);
//core.A.addValue(-1*0x60);
//core.Operations[145].exec(core);
//core.Operations[196].exec(core);

core.Operations[203].exec(core);
console.log(memoryUnit.readByte(0x77FF).toString(16));
//console.log(memoryUnit.readByte(0x110E).toString(16));
core.cpuDump();
// //console.log(0x3FFF);
