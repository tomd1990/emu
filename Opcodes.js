
//Opcodes
//organized as an array with the first byte used to lookup function opcode[0xXX]
// special care for 0xCB
var opcodes = [];
var opcodes_CB = [];

//No Operation
opcodes[0] = {
  mnemonic: "NOP",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
// LD BC,d16
opcodes[1] = {
  mnemonic: "LD BC, d16",
  blength: 3,
  m_cycle: 3,
  t_cycle: 12,
  exec: function(cpu) {
    let lnib = '00' + cpu.mem.readByte(cpu.PC.getValue()+1).toString(16);
    let unib = (cpu.mem.readByte(cpu.PC.getValue()+2)<<8).toString(16);
    let d16 = parseInt(lnib,16) + parseInt(unib,16);
    cpu.C.setValue(d16&0x00FF);
    cpu.B.setValue((d16>>8)&0x00FF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
//LD (BC), A load whatevers in A into memory location BC
opcodes[2] = {
  mnemonic: "LD (BC), A",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    //write into memory need memory access apis
    let c = '00' + cpu.C.getValue().toString(16);
    let b = (cpu.B.getValue()<<8).toString(16);
    let add = parseInt(b,16) + parseInt(c,16);
    cpu.mem.writeByte(add,cpu.A.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
//Increment value of BC
opcodes[3] = {
  mnemonic: "INC BC",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    //write into memory need memory access apis
    let BC = ((cpu.B.getValue()<<8)|(cpu.C.getValue()))+1;
    cpu.B.setValue((BC&0xFF00)>>>8);
    cpu.C.setValue(BC&0x00FF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}

//increment register B and update flags
opcodes[4] = {
  mnemonic: "INC B",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let hc = cpu.B.getValue()&0x0F;
    let f = cpu.F.getValue();
    cpu.B.addValue(1);
    if(cpu.B.getValue()==0) {
      f |= 0x80;
    }
    else {
      f &= 0x70;
    }
    //set subtract flag to 0
    f &= 0xB0;
    //half carry flag
    if(hc == 0x0F) {
      f |=0x20;
    }
    else {
      f &= 0xD0;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}

//Dec B
opcodes[5] = {
  mnemonic: "DEC B",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let hc = cpu.B.getValue()&0x0F;
    let f = cpu.F.getValue();
    cpu.B.addValue(-1);
    if(cpu.B.getValue()==0) {
      f|= 0x80;
    }
    else {
      f &= 0x70;
    }
    //set subtract flag to 1
    f |= 0x40;
    //half carry flag
    if(hc == 0x00) {
      f|=0x20;
    }
    else {
      f &= 0xD0;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}

opcodes[6] = {
  mnemonic: "LD B, d8",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let d8 = cpu.mem.readByte(cpu.PC.getValue()+1);
    cpu.B.setValue(d8);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
//shift A left by one
opcodes[7] = {
  mnemonic: "RLCA",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let f = 0x00;
    let a = cpu.A.getValue();
    let end = a&0x80;
    if(end) {
      f |=0x10;
      cpu.A.setValue( ((a<<1)&0xFF)|0x01 );
    }
    else {
      cpu.A.setValue( (a<<1)&0xFF);
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
//LD SP 16 bit address
opcodes[8] = {
  mnemonic: "LD (a16), SP",
  blength: 3,
  m_cycle: 5,
  t_cycle: 20,
  exec: function(cpu) {
    let lnib = '00' + cpu.mem.readByte(cpu.PC.getValue()+1).toString(16);
    let unib = (cpu.mem.readByte(cpu.PC.getValue()+2)<<8).toString(16);
    let a16 = parseInt(lnib,16) + parseInt(unib,16);
    let upperByte = cpu.SP.getValue()>>>8;
    let lowerByte = cpu.SP.getValue()&0x00FF;
    cpu.mem.writeByte(a16,lowerByte);
    cpu.mem.writeByte(a16+1,upperByte);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}

opcodes[9] = {
  mnemonic: "Add HL, BC",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    // - 0 H C
    let f = cpu.F.getValue();
    let BC = (cpu.B.getValue()<<8)|(cpu.C.getValue());
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    if( (HL + BC) > 0xFFFF) {
      //Carry flag
      f |= 0x10;
    }
    else {
      f &= 0xE0;
    }

    if( ((HL&0x0FFF) + (BC&0x0FFF)) > 0x0FFF) {
      // Half Carry Flag
      f |= 0x20;
    }
    else {
      f &= 0xD0;
    }
    //0 subtract flag
    f &=0xB0;
    cpu.F.setValue(f);
    cpu.L.setValue((HL+BC)&0x00FF);
    cpu.H.setValue(((HL+BC)&0xFF00)>>>8);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[10] = {
  mnemonic: "LD A, (BC)",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let BC = (cpu.B.getValue()<<8)|(cpu.C.getValue());
    cpu.A.setValue(cpu.mem.readByte(BC));
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[11] = {
  mnemonic: "DEC BC",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let BC = ((cpu.B.getValue()<<8)|(cpu.C.getValue()))-1;
    cpu.B.setValue((BC&0xFF00)>>>8);
    cpu.C.setValue(BC&0x00FF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[12] = {
  mnemonic: "INC C",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let hc = cpu.C.getValue()&0x0F;
    let f = cpu.F.getValue();
    cpu.C.addValue(1);
    if(cpu.C.getValue()==0) {
      f |= 0x80;
    }
    else {
      f &= 0x70;
    }
    //set subtract flag to 0
    f &= 0xB0;
    //half carry flag
    if(hc == 0x0F) {
      f |=0x20;
    }
    else {
      f &= 0xD0;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[13] = {
  mnemonic: "DEC C",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let hc = cpu.C.getValue()&0x0F;
    let f = cpu.F.getValue();
    cpu.C.addValue(-1);
    if(cpu.C.getValue()==0) {
      f|= 0x80;
    }
    else {
      f &= 0x70;
    }
    //set subtract flag to 1
    f |= 0x40;
    //half carry flag
    if(hc == 0x00) {
      f|=0x20;
    }
    else {
      f &= 0xD0;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[14] = {
  mnemonic: "LD C, d8",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let d8 = cpu.mem.readByte(cpu.PC.getValue()+1);
    cpu.C.setValue(d8);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
//Shift Right 1
opcodes[15] = {
  mnemonic: "RRCA",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let f = 0x00;
    let a = cpu.A.getValue();
    let end = a&0x01;
    if(end) {
      f |=0x10;
      cpu.A.setValue( ((a>>1)&0xFF)|0x80 );
    }
    else {
      cpu.A.setValue( (a>>1)&0xFF);
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[16] = {
  mnemonic: "STOP 0",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    //stop oscillator and put cpu in powersave mode
//     The STOP command halts the GameBoy processor
// and screen until any button is pressed. The GB
// and GBP screen goes white with a single dark
// horizontal line. The GBC screen goes black.
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[17] = {
  mnemonic: "LD DE, d16",
  blength: 3,
  m_cycle: 3,
  t_cycle: 12,
  exec: function(cpu) {
    let lnib = '00' + cpu.mem.readByte(cpu.PC.getValue()+1).toString(16);
    let unib = (cpu.mem.readByte(cpu.PC.getValue()+2)<<8).toString(16);
    let d16 = parseInt(lnib,16) + parseInt(unib,16);
    cpu.E.setValue(d16&0x00FF);
    cpu.D.setValue((d16>>8)&0x00FF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[18] = {
  mnemonic: "LD (DE), A",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    //write into memory need memory access apis
    let DE = (cpu.D.getValue()<<8)|(cpu.E.getValue());
    cpu.mem.writeByte(DE,cpu.A.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[19] = {
  mnemonic: "INC DE",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    //write into memory need memory access apis
    let DE = ((cpu.D.getValue()<<8)|(cpu.E.getValue()))+1;
    cpu.D.setValue((DE&0xFF00)>>>8);
    cpu.E.setValue(DE&0x00FF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[20] = {
  mnemonic: "INC D",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let hc = cpu.D.getValue()&0x0F;
    let f = cpu.F.getValue();
    cpu.D.addValue(1);
    if(cpu.D.getValue()==0) {
      f |= 0x80;
    }
    else {
      f &= 0x70;
    }
    //set subtract flag to 0
    f &= 0xB0;
    //half carry flag
    if(hc == 0x0F) {
      f |=0x20;
    }
    else {
      f &= 0xD0;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}

//Dec B
opcodes[21] = {
  mnemonic: "DEC D",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let hc = cpu.D.getValue()&0x0F;
    let f = cpu.F.getValue();
    cpu.D.addValue(-1);
    if(cpu.D.getValue()==0) {
      f|= 0x80;
    }
    else {
      f &= 0x70;
    }
    //set subtract flag to 1
    f |= 0x40;
    //half carry flag
    if(hc == 0x00) {
      f|=0x20;
    }
    else {
      f &= 0xD0;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[22] = {
  mnemonic: "LD D, d8",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let d8 = cpu.mem.readByte(cpu.PC.getValue()+1);
    cpu.D.setValue(d8);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
//shift A left by one this includes Carry bit of flag register
opcodes[23] = {
  mnemonic: "RLA",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let f = 0x00;
    let c = (cpu.F.getValue()&0x10)>>>4;
    let a = cpu.A.getValue();
    let end = a&0x80;
    if(end) {
      f |=0x10;
      cpu.A.setValue( ((a<<1)&0xFF)|c);
    }
    else {
      cpu.A.setValue( (a<<1)&0xFF|c);
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[24] = {
  mnemonic: "JR r8",
  blength: 2,
  m_cycle: 3,
  t_cycle: 12,
  exec: function(cpu) {
    // convert signedByte and add it to PC 127 to -127
    let r8 = new Int8Array(1);
    r8[0] = cpu.mem.readByte(cpu.PC.getValue()+1);
    cpu.PC.addValue(this.blength + r8[0]);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
  }
}
opcodes[25] = {
  mnemonic: "ADD HL, DE",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    // - 0 H C
    let f = cpu.F.getValue();
    let DE = (cpu.D.getValue()<<8)|(cpu.E.getValue());
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    if( (HL + DE) > 0xFFFF) {
      //Carry flag
      f |= 0x10;
    }
    else {
      f &= 0xE0;
    }
    if( ((HL&0x0FFF) + (DE&0x0FFF)) > 0x0FFF) {
      // Half Carry Flag
      f |= 0x20;
    }
    else {
      f &= 0xD0;
    }
    //0 subtract flag
    f &=0xB0;
    cpu.F.setValue(f);
    cpu.L.setValue((HL+DE)&0x00FF);
    cpu.H.setValue(((HL+DE)&0xFF00)>>>8);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[26] = {
  mnemonic: "LD A, (DE)",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let DE = (cpu.D.getValue()<<8)|(cpu.E.getValue());
    cpu.A.setValue(cpu.mem.readByte(DE));
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[27] = {
  mnemonic: "DEC DE",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let DE = ((cpu.D.getValue()<<8)|(cpu.E.getValue()))-1;
    cpu.D.setValue((DE&0xFF00)>>>8);
    cpu.E.setValue(DE&0x00FF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[28] = {
  mnemonic: "INC E",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let hc = cpu.E.getValue()&0x0F;
    let f = cpu.F.getValue();
    cpu.E.addValue(1);
    if(cpu.E.getValue()==0) {
      f |= 0x80;
    }
    else {
      f &= 0x70;
    }
    //set subtract flag to 0
    f &= 0xB0;
    //half carry flag
    if(hc == 0x0F) {
      f |=0x20;
    }
    else {
      f &= 0xD0;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[29] = {
  mnemonic: "DEC E",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let hc = cpu.E.getValue()&0x0F;
    let f = cpu.F.getValue();
    cpu.E.addValue(-1);
    if(cpu.E.getValue()==0) {
      f|= 0x80;
    }
    else {
      f &= 0x70;
    }
    //set subtract flag to 1
    f |= 0x40;
    //half carry flag
    if(hc == 0x00) {
      f|=0x20;
    }
    else {
      f &= 0xD0;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[30] = {
  mnemonic: "LD E, d8",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let d8 = cpu.mem.readByte(cpu.PC.getValue()+1);
    cpu.E.setValue(d8);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
//shift A Right by one this includes Carry bit of flag register
opcodes[31] = {
  mnemonic: "RRA",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let f = 0x00;
    let c = (cpu.F.getValue()&0x10)<<3;
    let a = cpu.A.getValue();
    let end = a&0x01;
    if(end) {
      f |=0x10;
      cpu.A.setValue( ((a>>>1)&0xFF)|c);
    }
    else {
      cpu.A.setValue( ((a>>>1)&0xFF)|c);
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[32] = {
  mnemonic: "JR NZ, r8",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    // convert signedByte and add it to PC 127 to -127
    let r8 = new Int8Array(1);
    r8[0] = cpu.mem.readByte(cpu.PC.getValue()+1);
    if(!(cpu.F.getValue()&0x80)) {
      cpu.PC.addValue(this.blength + r8[0]);
      cpu._clock.m+=3;
      cpu._clock.t+=12;
    }
    else {
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
    }

  }
}
opcodes[33] = {
  mnemonic: "LD HL, d16",
  blength: 3,
  m_cycle: 3,
  t_cycle: 12,
  exec: function(cpu) {
    let lnib = '00' + cpu.mem.readByte(cpu.PC.getValue()+1).toString(16);
    let unib = (cpu.mem.readByte(cpu.PC.getValue()+2)<<8).toString(16);
    let d16 = parseInt(lnib,16) + parseInt(unib,16);
    cpu.L.setValue(d16&0x00FF);
    cpu.H.setValue((d16>>8)&0x00FF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[34] = {
  mnemonic: "LD (HL+), A",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let l = '00' + cpu.L.getValue().toString(16);
    let h = (cpu.H.getValue()<<8).toString(16);
    let add = parseInt(h,16) + parseInt(l,16);
    cpu.L.setValue((add+1)&0x00FF);
    cpu.H.setValue(((add+1)>>8)&0x00FF);
    cpu.mem.writeByte(add,cpu.A.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[35] = {
  mnemonic: "INC HL",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    //write into memory need memory access apis
    let HL = ((cpu.H.getValue()<<8)|(cpu.L.getValue()))+1;
    cpu.H.setValue((HL&0xFF00)>>>8);
    cpu.L.setValue(HL&0x00FF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[36] = {
  mnemonic: "INC H",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let hc = cpu.H.getValue()&0x0F;
    let f = cpu.F.getValue();
    cpu.H.addValue(1);
    if(cpu.H.getValue()==0) {
      f |= 0x80;
    }
    else {
      f &= 0x70;
    }
    //set subtract flag to 0
    f &= 0xB0;
    //half carry flag
    if(hc == 0x0F) {
      f |=0x20;
    }
    else {
      f &= 0xD0;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[37] = {
  mnemonic: "DEC H",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let hc = cpu.H.getValue()&0x0F;
    let f = cpu.F.getValue();
    cpu.H.addValue(-1);
    if(cpu.H.getValue()==0) {
      f|= 0x80;
    }
    else {
      f &= 0x70;
    }
    //set subtract flag to 1
    f |= 0x40;
    //half carry flag
    if(hc == 0x00) {
      f|=0x20;
    }
    else {
      f &= 0xD0;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[38] = {
  mnemonic: "LD H, d8",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let d8 = cpu.mem.readByte(cpu.PC.getValue()+1);
    cpu.H.setValue(d8);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
//DAA makes it decimal
//z is 1 if A is 0
//N not affected
//H reset
//c set or reset accorsing to Operation
opcodes[39] = {
  mnemonic: "DAA",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let f = cpu.F.getValue();
    let a = cpu.A.getValue();
    let lnib = a&0x0F;
    if(!(f&0x40) ) {
      if( f&0x10 || (a > 0x99) ) {
        cpu.A.addValue(0x60);
        f |=0x10;
      }
      if( f&0x20 || (lnib > 0x09) ) {
        cpu.A.addValue(0x06);
      }
    }
    else {
      if( f&0x10 ) {
        cpu.A.addValue(-1*0x60);
      }
      if(f&0x20) {
        cpu.A.addValue(-1*0x06);
      }
    }
    if(a == 0) {
      f |= 0x80;
    }
    else {
      f &=0x70;
    }
    //clear h flag
    f &= 0xD0;
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[40] = {
  mnemonic: "JR Z, r8",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    // convert signedByte and add it to PC 127 to -127
    let r8 = new Int8Array(1);
    r8[0] = cpu.mem.readByte(cpu.PC.getValue()+1);
    if(cpu.F.getValue()&0x80){
      cpu.PC.addValue(this.blength + r8[0]);
      cpu._clock.m+=3;
      cpu._clock.t+=12;
    }
    else {
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
    }

  }
}
opcodes[41] = {
  mnemonic: "ADD HL, HL",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    // - 0 H C
    let f = cpu.F.getValue();
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    if( (HL + HL) > 0xFFFF) {
      //Carry flag
      f |= 0x10;
    }
    else {
      f &= 0xE0;
    }

    if( ((HL&0x0FFF) + (HL&0x0FFF)) > 0x0FFF) {
      // Half Carry Flag
      f |= 0x20;
    }
    else {
      f &= 0xD0;
    }
    //0 subtract flag
    f &=0xB0;
    cpu.F.setValue(f);
    cpu.L.setValue((HL+HL)&0x00FF);
    cpu.H.setValue(((HL+HL)&0xFF00)>>>8);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[42] = {
  mnemonic: "LD A, (HL+)",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    cpu.A.setValue(cpu.mem.readByte(HL));
    cpu.L.setValue((HL+1)&0x00FF);
    cpu.H.setValue(((HL+1)>>8)&0x00FF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[43] = {
  mnemonic: "DEC HL",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = ((cpu.H.getValue()<<8)|(cpu.L.getValue()))-1;
    cpu.H.setValue((HL&0xFF00)>>>8);
    cpu.L.setValue(HL&0x00FF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[44] = {
  mnemonic: "INC L",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let hc = cpu.L.getValue()&0x0F;
    let f = cpu.F.getValue();
    cpu.L.addValue(1);
    if(cpu.L.getValue()==0) {
      f |= 0x80;
    }
    else {
      f &= 0x70;
    }
    //set subtract flag to 0
    f &= 0xB0;
    //half carry flag
    if(hc == 0x0F) {
      f |=0x20;
    }
    else {
      f &= 0xD0;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[45] = {
  mnemonic: "DEC L",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let hc = cpu.L.getValue()&0x0F;
    let f = cpu.F.getValue();
    cpu.L.addValue(-1);
    if(cpu.L.getValue()==0) {
      f|= 0x80;
    }
    else {
      f &= 0x70;
    }
    //set subtract flag to 1
    f |= 0x40;
    //half carry flag
    if(hc == 0x00) {
      f|=0x20;
    }
    else {
      f &= 0xD0;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[46] = {
  mnemonic: "LD L, d8",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let d8 = cpu.mem.readByte(cpu.PC.getValue()+1);
    cpu.L.setValue(d8);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[47] = {
  mnemonic: "CPL",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let f = cpu.F.getValue()|0x60;
    let a = cpu.A.getValue();
    cpu.A.setValue(a^0xFF);
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[48] = {
  mnemonic: "JR NC, r8",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    // convert signedByte and add it to PC 127 to -127
    let r8 = new Int8Array(1);
    r8[0] = cpu.mem.readByte(cpu.PC.getValue()+1);;
    if(!(cpu.F.getValue()&0x10)) {
      cpu.PC.addValue(this.blength + r8[0]);
      cpu._clock.m+=3;
      cpu._clock.t+=12;
    }
    else {
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
    }

  }
}
opcodes[49] = {
  mnemonic: "LD SP, d16",
  blength: 3,
  m_cycle: 3,
  t_cycle: 12,
  exec: function(cpu) {
    let lnib = '00' + cpu.mem.readByte(cpu.PC.getValue()+1).toString(16);
    let unib = (cpu.mem.readByte(cpu.PC.getValue()+2)<<8).toString(16);
    let d16 = parseInt(lnib,16) + parseInt(unib,16);
    cpu.SP.setValue(d16);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[50] = {
  mnemonic: "LD (HL----), A",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    cpu.L.setValue((HL-1)&0x00FF);
    cpu.H.setValue(((HL-1)>>8)&0x00FF);
    cpu.mem.writeByte(HL,cpu.A.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[51] = {
  mnemonic: "INC SP",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    //write into memory need memory access apis
    cpu.SP.addValue(1);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[52] = {
  mnemonic: "INC (HL)",
  blength: 1,
  m_cycle: 3,
  t_cycle: 12,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = new Uint8Array(1);
    val[0]  = cpu.mem.readByte(HL);
    let hc = val[0]&0x0F;
    let f = cpu.F.getValue();
    val[0]+=1;
    if(val[0]==0) {
      f |= 0x80;
    }
    else {
      f &= 0x70;
    }
    //set subtract flag to 0
    f &= 0xB0;
    //half carry flag
    if(hc == 0x0F) {
      f |=0x20;
    }
    else {
      f &= 0xD0;
    }
    cpu.F.setValue(f);
    cpu.mem.writeByte(HL,val[0]);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[53] = {
  mnemonic: "DEC (HL)",
  blength: 1,
  m_cycle: 3,
  t_cycle: 12,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = new Uint8Array(1);
    val[0]  = cpu.mem.readByte(HL);
    let hc = val[0]&0x0F;
    let f = cpu.F.getValue();
    val[0]-=1;
    if(val[0]==0) {
      f|= 0x80;
    }
    else {
      f &= 0x70;
    }
    //set subtract flag to 1
    f|=0x40;
    //half carry flag
    console.log(f.toString(16));
    if(hc == 0x00) {
      f|=0x20;
    }
    else {
      f &= 0xD0;
    }
    cpu.mem.writeByte(HL,val[0]);
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[54] = {
  mnemonic: "LD (HL), d8",
  blength: 2,
  m_cycle: 3,
  t_cycle: 12,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let d8 = cpu.mem.readByte(cpu.PC.getValue()+1);
    cpu.mem.writeByte(HL, d8)
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
//just sets carry flag to 1
opcodes[55] = {
  mnemonic: "SCF",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let f = cpu.F.getValue();
    f |= 0x10;
    f &= 0x90;
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[56] = {
  mnemonic: "JR C, r8",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    // convert signedByte and add it to PC 127 to -127
    let r8 = new Int8Array(1);
    r8[0] = cpu.mem.readByte(cpu.PC.getValue()+1);
    if(cpu.F.getValue()&0x10){
      cpu.PC.addValue(this.blength + r8[0]);
      cpu._clock.m+=3;
      cpu._clock.t+=12;
    }
    else {
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
    }

  }
}
opcodes[57] = {
  mnemonic: "ADD HL, SP",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    // - 0 H C
    let f = cpu.F.getValue();
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    if( (HL + cpu.SP.getValue()) > 0xFFFF) {
      //Carry flag
      f |= 0x10;
    }
    else {
      f &= 0xE0;
    }

    if( ((HL&0x0FFF) + (cpu.SP.getValue()&0x0FFF)) > 0x0FFF) {
      // Half Carry Flag
      f |= 0x20;
    }
    else {
      f &= 0xD0;
    }
    //0 subtract flag
    f &=0xB0;
    cpu.F.setValue(f);
    cpu.L.setValue((HL+cpu.SP.getValue())&0x00FF);
    cpu.H.setValue(((HL+cpu.SP.getValue())&0xFF00)>>>8);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[58] = {
  mnemonic: "LD A, (HL-)",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    cpu.A.setValue(cpu.mem.readByte(HL));
    cpu.L.setValue((HL-1)&0x00FF);
    cpu.H.setValue(((HL-1)>>8)&0x00FF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[59] = {
  mnemonic: "DEC SP",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.SP.addValue(-1);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[60] = {
  mnemonic: "INC A",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let hc = cpu.A.getValue()&0x0F;
    let f = cpu.F.getValue();
    cpu.A.addValue(1);
    if(cpu.A.getValue()==0) {
      f |= 0x80;
    }
    else {
      f &= 0x70;
    }
    //set subtract flag to 0
    f &= 0xB0;
    //half carry flag
    if(hc == 0x0F) {
      f |=0x20;
    }
    else {
      f &= 0xD0;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[61] = {
  mnemonic: "DEC A",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let hc = cpu.A.getValue()&0x0F;
    let f = cpu.F.getValue();
    cpu.A.addValue(-1);
    if(cpu.A.getValue()==0) {
      f|= 0x80;
    }
    else {
      f &= 0x70;
    }
    //set subtract flag to 1
    f |= 0x40;
    //half carry flag
    if(hc == 0x00) {
      f|=0x20;
    }
    else {
      f &= 0xD0;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[62] = {
  mnemonic: "LD A, d8",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let d8 = cpu.mem.readByte(cpu.PC.getValue()+1);
    cpu.A.setValue(d8);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[63] = {
  mnemonic: "CCF",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x90;
    cpu.F.setValue(f^0x10);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
//purpose?
opcodes[64] = {
  mnemonic: "LD B, B",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.B.setValue(cpu.B.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[65] = {
  mnemonic: "LD B, C",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.B.setValue(cpu.C.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[66] = {
  mnemonic: "LD B, D",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.B.setValue(cpu.D.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[67] = {
  mnemonic: "LD B, E",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.B.setValue(cpu.E.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[68] = {
  mnemonic: "LD B, H",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.B.setValue(cpu.H.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[69] = {
  mnemonic: "LD B, L",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.B.setValue(cpu.L.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[70] = {
  mnemonic: "LD B, (HL)",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    cpu.B.setValue(cpu.mem.readByte(HL));
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[71] = {
  mnemonic: "LD B, A",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.B.setValue(cpu.A.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[72] = {
  mnemonic: "LD C, B",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.C.setValue(cpu.B.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[73] = {
  mnemonic: "LD C, C",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.C.setValue(cpu.C.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[74] = {
  mnemonic: "LD C, D",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.C.setValue(cpu.D.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[75] = {
  mnemonic: "LD C, E",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.C.setValue(cpu.E.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[76] = {
  mnemonic: "LD C, H",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.C.setValue(cpu.H.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[77] = {
  mnemonic: "LD C, L",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.C.setValue(cpu.L.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[78] = {
  mnemonic: "LD C, (HL)",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    cpu.C.setValue(cpu.mem.readByte(HL));
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[79] = {
  mnemonic: "LD C, A",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.C.setValue(cpu.A.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[80] = {
  mnemonic: "LD D, B",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.D.setValue(cpu.B.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[81] = {
  mnemonic: "LD D, C",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.D.setValue(cpu.C.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[82] = {
  mnemonic: "LD D, D",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.D.setValue(cpu.D.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[83] = {
  mnemonic: "LD D, E",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.D.setValue(cpu.E.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[84] = {
  mnemonic: "LD D, H",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.D.setValue(cpu.H.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[85] = {
  mnemonic: "LD D, L",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.D.setValue(cpu.L.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[86] = {
  mnemonic: "LD D, (HL)",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    cpu.D.setValue(cpu.mem.readByte(HL));
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[87] = {
  mnemonic: "LD D, A",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.D.setValue(cpu.A.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[88] = {
  mnemonic: "LD E, B",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.E.setValue(cpu.B.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[89] = {
  mnemonic: "LD E, C",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.E.setValue(cpu.C.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[90] = {
  mnemonic: "LD E, D",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.E.setValue(cpu.D.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[91] = {
  mnemonic: "LD E, E",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.E.setValue(cpu.E.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[92] = {
  mnemonic: "LD E, H",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.E.setValue(cpu.H.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[93] = {
  mnemonic: "LD E, L",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.E.setValue(cpu.L.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[94] = {
  mnemonic: "LD E, (HL)",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    cpu.E.setValue(cpu.mem.readByte(HL));
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[95] = {
  mnemonic: "LD E, A",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.E.setValue(cpu.A.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[96] = {
  mnemonic: "LD H, B",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.H.setValue(cpu.B.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[97] = {
  mnemonic: "LD H, C",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.H.setValue(cpu.C.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[98] = {
  mnemonic: "LD H, D",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.H.setValue(cpu.D.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[99] = {
  mnemonic: "LD H, E",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.H.setValue(cpu.E.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[100] = {
  mnemonic: "LD H, H",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.H.setValue(cpu.H.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[101] = {
  mnemonic: "LD H, L",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.H.setValue(cpu.L.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[102] = {
  mnemonic: "LD H, (HL)",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    cpu.H.setValue(cpu.mem.readByte(HL));
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[103] = {
  mnemonic: "LD H, A",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.H.setValue(cpu.A.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[104] = {
  mnemonic: "LD L, B",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.L.setValue(cpu.B.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[105] = {
  mnemonic: "LD L, C",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.L.setValue(cpu.C.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[106] = {
  mnemonic: "LD L, D",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.L.setValue(cpu.D.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[107] = {
  mnemonic: "LD L, E",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.L.setValue(cpu.E.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[108] = {
  mnemonic: "LD L, H",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.E.setValue(cpu.H.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[109] = {
  mnemonic: "LD L, L",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.L.setValue(cpu.L.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[110] = {
  mnemonic: "LD L, (HL)",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    cpu.L.setValue(cpu.mem.readByte(HL));
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[111] = {
  mnemonic: "LD L, A",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.L.setValue(cpu.A.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[112] = {
  mnemonic: "LD (HL), B",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    cpu.mem.writeByte(HL, cpu.B.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[113] = {
  mnemonic: "LD (HL), C",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    cpu.mem.writeByte(HL, cpu.C.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[114] = {
  mnemonic: "LD (HL), D",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    cpu.mem.writeByte(HL, cpu.D.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[115] = {
  mnemonic: "LD (HL), E",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    cpu.mem.writeByte(HL, cpu.E.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[116] = {
  mnemonic: "LD (HL), H",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    cpu.mem.writeByte(HL, cpu.H.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[117] = {
  mnemonic: "LD (HL), L",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    cpu.mem.writeByte(HL, cpu.L.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[118] = {
  mnemonic: "HALT",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    //Nop until interrupt occurs
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[119] = {
  mnemonic: "LD (HL) A",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    cpu.mem.writeByte(HL, cpu.A.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[120] = {
  mnemonic: "LD A, B",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.A.setValue(cpu.B.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[121] = {
  mnemonic: "LD A, C",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.A.setValue(cpu.C.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[122] = {
  mnemonic: "LD A, D",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.A.setValue(cpu.D.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[123] = {
  mnemonic: "LD A, E",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.A.setValue(cpu.E.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[124] = {
  mnemonic: "LD A, H",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.A.setValue(cpu.H.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[125] = {
  mnemonic: "LD A, L",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.A.setValue(cpu.L.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[126] = {
  mnemonic: "LD A (HL)",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    cpu.A.setValue(cpu.mem.readByte(HL));
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[127] = {
  mnemonic: "LD A, A",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    cpu.A.setValue(cpu.A.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[128] = {
    mnemonic: "ADD A, B",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let b = cpu.B.getValue();
      let f = cpu.F.getValue();
      if( (a+b) > 0xFF ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if(   ( (a&0x0F)+ ( b&0x0F) ) > 0x0F ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 0
      f &=0xB0;
      cpu.A.addValue(b);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[129] = {
    mnemonic: "ADD A, C",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let c = cpu.C.getValue();
      let f = cpu.F.getValue();
      if( (a+c) > 0xFF ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if( ( (a&0x0F)+ ( c&0x0F) ) > 0x0F ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 0
      f &=0xB0;
      cpu.A.addValue(c);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[130] = {
    mnemonic: "ADD A, D",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let d = cpu.D.getValue();
      let f = cpu.F.getValue();
      if( (a+d) > 0xFF ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if( ( (a&0x0F)+ ( d&0x0F) ) > 0x0F ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 0
      f &=0xB0;
      cpu.A.addValue(d);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[131] = {
    mnemonic: "ADD A, E",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let e = cpu.E.getValue();
      let f = cpu.F.getValue();
      if( (a+e) > 0xFF ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if( ( (a&0x0F)+ ( e&0x0F) ) > 0x0F ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 0
      f &=0xB0;
      cpu.A.addValue(e);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[132] = {
    mnemonic: "ADD A, H",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let h = cpu.H.getValue();
      let f = cpu.F.getValue();
      if( (a+c) > 0xFF ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if( ( (a&0x0F)+ ( h&0x0F) ) > 0x0F ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 0
      f &=0xB0;
      cpu.A.addValue(h);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[133] = {
    mnemonic: "ADD A, L",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let l = cpu.L.getValue();
      let f = cpu.F.getValue();
      if( (a+c) > 0xFF ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if( ( (a&0x0F)+ ( l&0x0F) ) > 0x0F ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 0
      f &=0xB0;
      cpu.A.addValue(l);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[134] = {
    mnemonic: "ADD A, (HL)",
    blength: 1,
    m_cycle: 2,
    t_cycle: 8,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
      let val = cpu.mem.readByte(HL);
      let f = cpu.F.getValue();
      if( (a+val) > 0xFF ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if( ( (a&0x0F)+ ( val&0x0F) ) > 0x0F ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 0
      f &=0xB0;
      cpu.A.addValue(val);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[135] = {
    mnemonic: "ADD A, A",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let f = cpu.F.getValue();
      if( (a+a) > 0xFF ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if( ( (a&0x0F)+ ( a&0x0F) ) > 0x0F ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 0
      f &=0xB0;
      cpu.A.addValue(a);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[136] = {
    mnemonic: "ADC A, B",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let b = cpu.B.getValue();
      let f = cpu.F.getValue();
      let carry = (cpu.F.getValue()&0x10)>>>4;
      if( (a+b+carry) > 0xFF ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if(   ( (a&0x0F)+ ( b&0x0F) + carry ) > 0x0F ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 0
      f &=0xB0;
      cpu.A.addValue(b+carry);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[137] = {
    mnemonic: "ADC A, C",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let c = cpu.C.getValue();
      let f = cpu.F.getValue();
      let carry = (cpu.F.getValue()&0x10)>>>4;
      if( (a+c+carry) > 0xFF ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }

      if(   ( (a&0x0F)+ ( c&0x0F) + carry ) > 0x0F ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 0
      f &=0xB0;
      cpu.A.addValue(c+carry);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[138] = {
    mnemonic: "ADC A, D",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let d = cpu.D.getValue();
      let f = cpu.F.getValue();
      let carry = (cpu.F.getValue()&0x10)>>>4;
      if( (a+d+carry) > 0xFF ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if(   ( (a&0x0F)+ ( d&0x0F) + carry ) > 0x0F ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 0
      f &=0xB0;
      cpu.A.addValue(d+carry);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[139] = {
    mnemonic: "ADC A, E",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let e = cpu.E.getValue();
      let f = cpu.F.getValue();
      let carry = (cpu.F.getValue()&0x10)>>>4;
      if( (a+e+carry) > 0xFF ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if(   ( (a&0x0F)+ ( e&0x0F) + carry ) > 0x0F ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 0
      f &=0xB0;
      cpu.A.addValue(e+carry);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[140] = {
    mnemonic: "ADC A, H",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let h = cpu.H.getValue();
      let f = cpu.F.getValue();
      let carry = (cpu.F.getValue()&0x10)>>>4;
      if( (a+h+carry) > 0xFF ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if(   ( (a&0x0F)+ ( h&0x0F) + carry ) > 0x0F ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 0
      f &=0xB0;
      cpu.A.addValue(h+carry);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[141] = {
    mnemonic: "ADC A, L",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let l = cpu.L.getValue();
      let f = cpu.F.getValue();
      let carry = (cpu.F.getValue()&0x10)>>>4;
      if( (a+l+carry) > 0xFF ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if(   ( (a&0x0F)+ ( l&0x0F) + carry ) > 0x0F ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 0
      f &=0xB0;
      cpu.A.addValue(l+carry);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[142] = {
    mnemonic: "ADC A, (HL)",
    blength: 1,
    m_cycle: 2,
    t_cycle: 8,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
      let val = cpu.mem.readByte(HL);
      let f = cpu.F.getValue();
      let carry = (cpu.F.getValue()&0x10)>>>4;
      if( (a+val+carry) > 0xFF ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if( ( (a&0x0F)+ ( val&0x0F) + carry) > 0x0F ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 0
      f &=0xB0;
      cpu.A.addValue(val +carry);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[143] = {
    mnemonic: "ADC A, A",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let f = cpu.F.getValue();
      let carry = (cpu.F.getValue()&0x10)>>>4;
      if( (a+a+carry) > 0xFF ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if(   ( (a&0x0F)+ ( a&0x0F) + carry ) > 0x0F ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 0
      f &=0xB0;
      cpu.A.addValue(a+carry);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[144] = {
    mnemonic: "SUB B",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let b = cpu.B.getValue();
      let f = cpu.F.getValue();
      if( (a-b) < 0 ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if(   ( (a&0x0F) - (b&0x0F)  ) < 0 ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 1
      f |=0x40;
      cpu.A.addValue(-b);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[145] = {
    mnemonic: "SUB C",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let c = cpu.C.getValue();
      let f = cpu.F.getValue();
      if( (a-c) < 0 ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if(   ( (a&0x0F) - (c&0x0F)  ) < 0 ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 1
      f |=0x40;
      cpu.A.addValue(-c);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[146] = {
    mnemonic: "SUB D",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let d = cpu.D.getValue();
      let f = cpu.F.getValue();
      if( (a-d) < 0 ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if(   ( (a&0x0F) - (d&0x0F)  ) < 0 ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 1
      f |=0x40;
      cpu.A.addValue(-d);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[147] = {
    mnemonic: "SUB E",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let e = cpu.E.getValue();
      let f = cpu.F.getValue();
      if( (a-e) < 0 ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if(   ( (a&0x0F) - (e&0x0F)  ) < 0 ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 1
      f |=0x40;
      cpu.A.addValue(-e);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[148] = {
    mnemonic: "SUB H",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let h = cpu.H.getValue();
      let f = cpu.F.getValue();
      if( (a-h) < 0 ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if(   ( (a&0x0F) - (h&0x0F)  ) < 0 ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 1
      f |=0x40;
      cpu.A.addValue(-h);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[149] = {
    mnemonic: "SUB L",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let l = cpu.L.getValue();
      let f = cpu.F.getValue();
      if( (a-l) < 0 ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if(   ( (a&0x0F) - (l&0x0F)  ) < 0 ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 1
      f |=0x40;
      cpu.A.addValue(-l);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[150] = {
    mnemonic: "SUB (HL)",
    blength: 1,
    m_cycle: 2,
    t_cycle: 8,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
      let val = cpu.mem.readByte(HL);
      let f = cpu.F.getValue();
      if( (a-val) < 0 ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if(   ( (a&0x0F) - (val&0x0F)  ) < 0 ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 1
      f |=0x40;
      cpu.A.addValue(-val);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[151] = {
    mnemonic: "SUB A",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let f = cpu.F.getValue();
      f&=0xE0;
      f&=0xD0;
      //set N flag 1
      f |=0x40;
      cpu.A.addValue(-a);
      f |= 0x80;
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[152] = {
    mnemonic: "SBC A, B",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let b = cpu.B.getValue();
      let f = cpu.F.getValue();
      let carry = (f&0x10)>>>4;
      if( (a-b-carry) < 0 ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if(   ( (a&0x0F) - (b&0x0F) - carry  ) < 0 ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 1
      f |=0x40;
      cpu.A.addValue(-b-carry);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[153] = {
    mnemonic: "SBC A, C",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let c = cpu.C.getValue();
      let f = cpu.F.getValue();
      let carry = (f&0x10)>>>4;
      if( (a-b-carry) < 0 ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if(   ( (a&0x0F) - (c&0x0F) - carry  ) < 0 ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 1
      f |=0x40;
      cpu.A.addValue(-c-carry);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[154] = {
    mnemonic: "SBC A, D",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let d = cpu.D.getValue();
      let f = cpu.F.getValue();
      let carry = (f&0x10)>>>4;
      if( (a-d-carry) < 0 ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if(   ( (a&0x0F) - (d&0x0F) - carry  ) < 0 ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 1
      f |=0x40;
      cpu.A.addValue(-d-carry);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[155] = {
    mnemonic: "SBC A, E",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let e = cpu.E.getValue();
      let f = cpu.F.getValue();
      let carry = (f&0x10)>>>4;
      if( (a-e-carry) < 0 ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if(   ( (a&0x0F) - (e&0x0F) - carry  ) < 0 ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 1
      f |=0x40;
      cpu.A.addValue(-e-carry);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[156] = {
    mnemonic: "SBC A, H",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let h = cpu.H.getValue();
      let f = cpu.F.getValue();
      let carry = (f&0x10)>>>4;
      if( (a-h-carry) < 0 ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if(   ( (a&0x0F) - (h&0x0F) - carry  ) < 0 ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 1
      f |=0x40;
      cpu.A.addValue(-h-carry);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[157] = {
    mnemonic: "SBC A, L",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let l = cpu.L.getValue();
      let f = cpu.F.getValue();
      let carry = (f&0x10)>>>4;
      if( (a-l-carry) < 0 ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if(   ( (a&0x0F) - (l&0x0F) - carry  ) < 0 ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 1
      f |=0x40;
      cpu.A.addValue(-l-carry);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[158] = {
    mnemonic: "SBC A, (HL)",
    blength: 1,
    m_cycle: 2,
    t_cycle: 8,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
      let val = cpu.mem.readByte(HL);
      let f = cpu.F.getValue();
      let carry = (f&0x10)>>>4;
      if( (a-val-carry) < 0 ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if(   ( (a&0x0F) - (val&0x0F) - carry  ) < 0 ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 1
      f |=0x40;
      cpu.A.addValue(-val-carry);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[159] = {
    mnemonic: "SBC A, A",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let f = cpu.F.getValue();
      let carry = (f&0x10)>>>4;
      if( (-carry) < 0 ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if(   (  -carry  ) < 0 ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 1
      f |=0x40;
      cpu.A.addValue(-carry);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[160] = {
    mnemonic: "AND B",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let b = cpu.B.getValue();
      let f = cpu.F.getValue();
      f|=0x20;
      f&=0xA0;
      cpu.A.setValue(a&b);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[161] = {
    mnemonic: "AND C",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let c = cpu.C.getValue();
      let f = cpu.F.getValue();
      f|=0x20;
      f&=0xA0;
      cpu.A.setValue(a&c);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[162] = {
    mnemonic: "AND D",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let d = cpu.D.getValue();
      let f = cpu.F.getValue();
      f|=0x20;
      f&=0xA0;
      cpu.A.setValue(a&d);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[163] = {
    mnemonic: "AND E",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let e = cpu.E.getValue();
      let f = cpu.F.getValue();
      f|=0x20;
      f&=0xA0;
      cpu.A.setValue(a&e);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[164] = {
    mnemonic: "AND H",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let h = cpu.H.getValue();
      let f = cpu.F.getValue();
      f|=0x20;
      f&=0xA0;
      cpu.A.setValue(a&h);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[165] = {
    mnemonic: "AND L",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let l = cpu.L.getValue();
      let f = cpu.F.getValue();
      f|=0x20;
      f&=0xA0;
      cpu.A.setValue(a&l);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[166] = {
    mnemonic: "AND (HL)",
    blength: 1,
    m_cycle: 2,
    t_cycle: 8,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
      let val = cpu.mem.readByte(HL);
      let f = cpu.F.getValue();
      f|=0x20;
      f&=0xA0;
      cpu.A.setValue(a&val);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[167] = {
    mnemonic: "AND A",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let f = cpu.F.getValue();
      f|=0x20;
      f&=0xA0;
      cpu.A.setValue(a&a);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[168] = {
    mnemonic: "XOR B",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let b = cpu.B.getValue();
      let f = cpu.F.getValue();
      f&=0x80;
      cpu.A.setValue(a^b);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[169] = {
    mnemonic: "XOR C",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let c = cpu.C.getValue();
      let f = cpu.F.getValue();
      f&=0x80;
      cpu.A.setValue(a^c);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[170] = {
    mnemonic: "XOR D",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let d = cpu.D.getValue();
      let f = cpu.F.getValue();
      f&=0x80;
      cpu.A.setValue(a^d);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[171] = {
    mnemonic: "XOR E",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let e = cpu.E.getValue();
      let f = cpu.F.getValue();
      f&=0x80;
      cpu.A.setValue(a^e);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[172] = {
    mnemonic: "XOR H",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let h = cpu.H.getValue();
      let f = cpu.F.getValue();
      f&=0x80;
      cpu.A.setValue(a^h);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[173] = {
    mnemonic: "XOR L",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let l = cpu.L.getValue();
      let f = cpu.F.getValue();
      f&=0x80;
      cpu.A.setValue(a^l);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[174] = {
    mnemonic: "XOR (HL)",
    blength: 1,
    m_cycle: 2,
    t_cycle: 8,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
      let val = cpu.mem.readByte(HL);
      let f = cpu.F.getValue();
      f&=0x80;
      cpu.A.setValue(a^val);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[175] = {
    mnemonic: "XOR A",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let f = cpu.F.getValue();
      f&=0x80;
      cpu.A.setValue(a^a);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[176] = {
    mnemonic: "OR B",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let b = cpu.B.getValue();
      let f = cpu.F.getValue();
      f&=0x80;
      cpu.A.setValue(a|b);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[177] = {
    mnemonic: "OR C",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let c = cpu.C.getValue();
      let f = cpu.F.getValue();
      f&=0x80;
      cpu.A.setValue(a|c);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[178] = {
    mnemonic: "OR D",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let d = cpu.D.getValue();
      let f = cpu.F.getValue();
      f&=0x80;
      cpu.A.setValue(a|d);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[179] = {
    mnemonic: "OR E",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let e = cpu.E.getValue();
      let f = cpu.F.getValue();
      f&=0x80;
      cpu.A.setValue(a|e);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[180] = {
    mnemonic: "OR H",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let h = cpu.H.getValue();
      let f = cpu.F.getValue();
      f&=0x80;
      cpu.A.setValue(a|h);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[181] = {
    mnemonic: "OR L",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let l = cpu.L.getValue();
      let f = cpu.F.getValue();
      f&=0x80;
      cpu.A.setValue(a|l);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[182] = {
    mnemonic: "OR (HL)",
    blength: 1,
    m_cycle: 2,
    t_cycle: 8,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
      let val = cpu.mem.readByte(HL);
      let f = cpu.F.getValue();
      f&=0x80;
      cpu.A.setValue(a|val);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[183] = {
    mnemonic: "OR A",
    blength: 1,
    m_cycle: 1,
    t_cycle: 4,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let f = cpu.F.getValue();
      f&=0x80;
      cpu.A.setValue(a|a);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[184] = {
  mnemonic: "CP B",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let a = cpu.A.getValue();
    let b = cpu.B.getValue();
    let f = cpu.F.getValue();
    if( (a-b) < 0 ) {
      f |= 0x10;
    }
    else {
      f&=0xE0;
    }
    if(   ( (a&0x0F) - (b&0x0F)  ) < 0 ) {
      f |= 0x20;
    }
    else {
      f&=0xD0;
    }
    //set N flag 1
    f |=0x40;
    if(a == b) {
      f |= 0x80;
    }
    else {
      f &= 0x70;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[185] = {
  mnemonic: "CP C",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let a = cpu.A.getValue();
    let c = cpu.C.getValue();
    let f = cpu.F.getValue();
    if( (a-c) < 0 ) {
      f |= 0x10;
    }
    else {
      f&=0xE0;
    }
    if(   ( (a&0x0F) - (c&0x0F)  ) < 0 ) {
      f |= 0x20;
    }
    else {
      f&=0xD0;
    }
    //set N flag 1
    f |=0x40;
    if(a == c) {
      f |= 0x80;
    }
    else {
      f &= 0x70;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[186] = {
  mnemonic: "CP D",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let a = cpu.A.getValue();
    let d = cpu.D.getValue();
    let f = cpu.F.getValue();
    if( (a-d) < 0 ) {
      f |= 0x10;
    }
    else {
      f&=0xE0;
    }
    if(   ( (a&0x0F) - (d&0x0F)  ) < 0 ) {
      f |= 0x20;
    }
    else {
      f&=0xD0;
    }
    //set N flag 1
    f |=0x40;
    if(a == d) {
      f |= 0x80;
    }
    else {
      f &= 0x70;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[187] = {
  mnemonic: "CP E",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let a = cpu.A.getValue();
    let e = cpu.E.getValue();
    let f = cpu.F.getValue();
    if( (a-e) < 0 ) {
      f |= 0x10;
    }
    else {
      f&=0xE0;
    }
    if(   ( (a&0x0F) - (e&0x0F)  ) < 0 ) {
      f |= 0x20;
    }
    else {
      f&=0xD0;
    }
    //set N flag 1
    f |=0x40;
    if(a == e) {
      f |= 0x80;
    }
    else {
      f &= 0x70;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[188] = {
  mnemonic: "CP H",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let a = cpu.A.getValue();
    let h = cpu.H.getValue();
    let f = cpu.F.getValue();
    if( (a-h) < 0 ) {
      f |= 0x10;
    }
    else {
      f&=0xE0;
    }
    if(   ( (a&0x0F) - (h&0x0F)  ) < 0 ) {
      f |= 0x20;
    }
    else {
      f&=0xD0;
    }
    //set N flag 1
    f |=0x40;
    if(a == h) {
      f |= 0x80;
    }
    else {
      f &= 0x70;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[189] = {
  mnemonic: "CP L",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let a = cpu.A.getValue();
    let l = cpu.L.getValue();
    let f = cpu.F.getValue();
    if( (a-l) < 0 ) {
      f |= 0x10;
    }
    else {
      f&=0xE0;
    }
    if(   ( (a&0x0F) - (l&0x0F)  ) < 0 ) {
      f |= 0x20;
    }
    else {
      f&=0xD0;
    }
    //set N flag 1
    f |=0x40;
    if(a == l) {
      f |= 0x80;
    }
    else {
      f &= 0x70;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[190] = {
  mnemonic: "CP (HL)",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let a = cpu.A.getValue();
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = cpu.mem.readByte(HL);
    let f = cpu.F.getValue();
    if( (a-val) < 0 ) {
      f |= 0x10;
    }
    else {
      f&=0xE0;
    }
    if(   ( (a&0x0F) - (val&0x0F)  ) < 0 ) {
      f |= 0x20;
    }
    else {
      f&=0xD0;
    }
    //set N flag 1
    f |=0x40;
    if(a == val) {
      f |= 0x80;
    }
    else {
      f &= 0x70;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[191] = {
  mnemonic: "CP A",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let a = cpu.A.getValue();
    let f = cpu.F.getValue();
    f&=0xE0;
    f&=0xD0;
    //set N flag 1
    f |=0x40;
    f |= 0x80;
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
//Pops two byte jump to that address
opcodes[192] = {
  mnemonic: "RET NZ",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue();
    if(!(f&0x80)) {
      let lnib = '00' + cpu.mem.readByte(cpu.SP.getValue()).toString(16);
      cpu.SP.addValue(1);
      let unib = (cpu.mem.readByte(cpu.SP.getValue())<<8).toString(16);
      cpu.SP.addValue(1);
      let address = parseInt(unib, 16) + parseInt(lnib,16);
      cpu.PC.setValue(address);
      cpu._clock.m+=5;
      cpu._clock.t+=20;
    }
    else {
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
  }
}
opcodes[193] = {
  mnemonic: "POP BC",
  blength: 1,
  m_cycle: 3,
  t_cycle: 12,
  exec: function(cpu) {
    let lnib = '00' + cpu.mem.readByte(cpu.SP.getValue()).toString(16);
    cpu.SP.addValue(1);
    cpu.C.setValue(parseInt(lnib,16));
    let unib = '00' + cpu.mem.readByte(cpu.SP.getValue()).toString(16);
    cpu.SP.addValue(1);
    cpu.B.setValue(parseInt(unib, 16));
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[194] = {
  mnemonic: "JP NZ a16",
  blength: 3,
  m_cycle: 3,
  t_cycle: 12,
  exec: function(cpu) {
    let f = cpu.F.getValue();
    if(!(f&0x80)) {
      let lnib = '00' + cpu.mem.readByte(cpu.PC.getValue()+1).toString(16);
      let unib = (cpu.mem.readByte(cpu.PC.getValue()+2)<<8).toString(16);
      let add = parseInt(lnib,16) + parseInt(unib,16);
      cpu.PC.setValue(add);
      cpu._clock.m+=4;
      cpu._clock.t+=16;
    }
    else {
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
  }
}
opcodes[195] = {
  mnemonic: "JP a16",
  blength: 3,
  m_cycle: 4,
  t_cycle: 16,
  exec: function(cpu) {
    let lnib = '00' + cpu.mem.readByte(cpu.PC.getValue()+1).toString(16);
    let unib = (cpu.mem.readByte(cpu.PC.getValue()+2)<<8).toString(16);
    let add = parseInt(lnib,16) + parseInt(unib,16);
    cpu.PC.setValue(add);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
  }
}
opcodes[196] = {
  mnemonic: "CALL NZ a16",
  blength: 3,
  m_cycle: 3,
  t_cycle: 12,
  exec: function(cpu) {
    let f = cpu.F.getValue();
    let ninst = cpu.PC.getValue()+this.blength;
    if(!(f&0x80)) {
      let lnib = (ninst&0x00FF);
      let unib = (ninst&0xFF00)>>>8;
      //Push address onto stack
      cpu.SP.addValue(-1);
      cpu.mem.writeByte(cpu.SP.getValue(),unib)
      cpu.SP.addValue(-1);
      cpu.mem.writeByte(cpu.SP.getValue(),lnib)
      let lniba = '00' + cpu.mem.readByte(cpu.PC.getValue()+1).toString(16);
      let uniba = (cpu.mem.readByte(cpu.PC.getValue()+2)<<8).toString(16);
      let add = parseInt(lniba,16) + parseInt(uniba,16);
      cpu.PC.setValue(add);
      cpu._clock.m+=6;
      cpu._clock.t+=24;
    }
    else {
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
  }
}
opcodes[197] = {
  mnemonic: "PUSH BC",
  blength: 1,
  m_cycle: 4,
  t_cycle: 16,
  exec: function(cpu) {
    cpu.SP.addValue(-1);
    cpu.mem.writeByte(cpu.SP.getValue(),cpu.B.getValue())
    cpu.SP.addValue(-1);
    cpu.mem.writeByte(cpu.SP.getValue(),cpu.C.getValue())
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[198] = {
  mnemonic: "ADD A, D8",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let a = cpu.A.getValue();
    let d8 = cpu.mem.readByte(cpu.PC.getValue()+1);
    let f = cpu.F.getValue();
    if( (a+d8) > 0xFF ) {
      f |= 0x10;
    }
    else {
      f&=0xE0;
    }
    if( ( (a&0x0F)+ ( d8&0x0F) ) > 0x0F ) {
      f |= 0x20;
    }
    else {
      f&=0xD0;
    }
    //set N flag 0
    f &=0xB0;
    cpu.A.addValue(d8);
    if(cpu.A.getValue() == 0) {
      f |= 0x80;
    }
    else {
      f &= 0x70;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[199] = {
  mnemonic: "RST 00H",
  blength: 1,
  m_cycle: 4,
  t_cycle: 16,
  exec: function(cpu) {
    let lnib = (cpu.PC.getValue()&0x00FF);
    let unib = (cpu.PC.getValue()&0xFF00)>>>8;
    cpu.SP.addValue(-1);
    cpu.mem.writeByte(cpu.SP.getValue(),unib);
    cpu.SP.addValue(-1);
    cpu.mem.writeByte(cpu.SP.getValue(),lnib);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.setValue(0x0000);
  }
}
opcodes[200] = {
  mnemonic: "RET Z",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue();
    if(f&0x80) {
      let lnib = '00' + cpu.mem.readByte(cpu.SP.getValue()).toString(16);
      cpu.SP.addValue(1);
      let unib = (cpu.mem.readByte(cpu.SP.getValue())<<8).toString(16);
      cpu.SP.addValue(1);
      let address = parseInt(unib, 16) + parseInt(lnib,16);
      cpu.PC.setValue(address);
      cpu._clock.m+=5;
      cpu._clock.t+=20;
    }
    else {
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
  }
}
opcodes[201] = {
  mnemonic: "RET",
  blength: 1,
  m_cycle: 4,
  t_cycle: 16,
  exec: function(cpu) {
    let lnib = '00' + cpu.mem.readByte(cpu.SP.getValue()).toString(16);
    cpu.SP.addValue(1);
    let unib = (cpu.mem.readByte(cpu.SP.getValue())<<8).toString(16);
    cpu.SP.addValue(1);
    let address = parseInt(unib, 16) + parseInt(lnib,16);
    cpu.PC.setValue(address);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
  }
}
opcodes[202] = {
  mnemonic: "JP Z a16",
  blength: 3,
  m_cycle: 3,
  t_cycle: 12,
  exec: function(cpu) {
    let f = cpu.F.getValue();
    if(f&0x80) {
      let lnib = '00' + cpu.mem.readByte(cpu.PC.getValue()+1).toString(16);
      let unib = (cpu.mem.readByte(cpu.PC.getValue()+2)<<8).toString(16);
      let add = parseInt(lnib,16) + parseInt(unib,16);
      cpu.PC.setValue(add);
      cpu._clock.m+=4;
      cpu._clock.t+=16;
    }
    else {
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
  }
}
opcodes[203] = {
  mnemonic: "CB PREFIX",
  exec: function(cpu) {
    let opcode = cpu.mem.readByte(cpu.PC.getValue() + 1);
    opcodes_CB[opcode].exec(cpu);
  }
}
opcodes[204] = {
  mnemonic: "CALL Z a16",
  blength: 3,
  m_cycle: 3,
  t_cycle: 12,
  exec: function(cpu) {
    let f = cpu.F.getValue();
    let ninst = cpu.PC.getValue()+this.blength;
    if(f&0x80) {
      let lnib = (ninst&0x00FF);
      let unib = (ninst&0xFF00)>>>8;
      //Push address onto stack
      cpu.SP.addValue(-1);
      cpu.mem.writeByte(cpu.SP.getValue(),unib)
      cpu.SP.addValue(-1);
      cpu.mem.writeByte(cpu.SP.getValue(),lnib)
      let lniba = '00' + cpu.mem.readByte(cpu.PC.getValue()+1).toString(16);
      let uniba = (cpu.mem.readByte(cpu.PC.getValue()+2)<<8).toString(16);
      let add = parseInt(lniba,16) + parseInt(uniba,16);
      cpu.PC.setValue(add);
      cpu._clock.m+=6;
      cpu._clock.t+=24;
    }
    else {
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
  }
}
opcodes[205] = {
  mnemonic: "CALL a16",
  blength: 3,
  m_cycle: 6,
  t_cycle: 24,
  exec: function(cpu) {
    let ninst = cpu.PC.getValue()+this.blength;
    let lnib = (ninst&0x00FF);
    let unib = (ninst&0xFF00)>>>8;
    //Push address onto stack
    cpu.SP.addValue(-1);
    cpu.mem.writeByte(cpu.SP.getValue(),unib)
    cpu.SP.addValue(-1);
    cpu.mem.writeByte(cpu.SP.getValue(),lnib)
    let lniba = '00' + cpu.mem.readByte(cpu.PC.getValue()+1).toString(16);
    let uniba = (cpu.mem.readByte(cpu.PC.getValue()+2)<<8).toString(16);
    let add = parseInt(lniba,16) + parseInt(uniba,16);
    cpu.PC.setValue(add);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
  }
}
opcodes[206] = {
    mnemonic: "ADC A, d8",
    blength: 1,
    m_cycle: 2,
    t_cycle: 8,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let d8 = cpu.mem.readByte(cpu.PC.getValue()+1);
      let f = cpu.F.getValue();
      let carry = (cpu.F.getValue()&0x10)>>>4;
      if( (a+d8+carry) > 0xFF ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if(   ( (a&0x0F)+ ( d8&0x0F) + carry ) > 0x0F ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 0
      f &=0xB0;
      cpu.A.addValue(d8+carry);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[207] = {
  mnemonic: "RST 08H",
  blength: 1,
  m_cycle: 4,
  t_cycle: 16,
  exec: function(cpu) {
    let lnib = (cpu.PC.getValue()&0x00FF);
    let unib = (cpu.PC.getValue()&0xFF00)>>>8;
    cpu.SP.addValue(-1);
    cpu.mem.writeByte(cpu.SP.getValue(),unib);
    cpu.SP.addValue(-1);
    cpu.mem.writeByte(cpu.SP.getValue(),lnib);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.setValue(0x0008);
  }
}
opcodes[208] = {
  mnemonic: "RET NC",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue();
    if(!(f&0x10)) {
      let lnib = '00' + cpu.mem.readByte(cpu.SP.getValue()).toString(16);
      cpu.SP.addValue(1);
      let unib = (cpu.mem.readByte(cpu.SP.getValue())<<8).toString(16);
      cpu.SP.addValue(1);
      let address = parseInt(unib, 16) + parseInt(lnib,16);
      cpu.PC.setValue(address);
      cpu._clock.m+=5;
      cpu._clock.t+=20;
    }
    else {
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
  }
}
opcodes[209] = {
  mnemonic: "POP DE",
  blength: 1,
  m_cycle: 3,
  t_cycle: 12,
  exec: function(cpu) {
    let lnib = '00' + cpu.mem.readByte(cpu.SP.getValue()).toString(16);
    cpu.SP.addValue(1);
    cpu.E.setValue(parseInt(lnib,16));
    let unib = '00' + cpu.mem.readByte(cpu.SP.getValue()).toString(16);
    cpu.SP.addValue(1);
    cpu.D.setValue(parseInt(unib, 16));
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[210] = {
  mnemonic: "JP NC a16",
  blength: 3,
  m_cycle: 3,
  t_cycle: 12,
  exec: function(cpu) {
    let f = cpu.F.getValue();
    if(!(f&0x10)) {
      let lnib = '00' + cpu.mem.readByte(cpu.PC.getValue()+1).toString(16);
      let unib = (cpu.mem.readByte(cpu.PC.getValue()+2)<<8).toString(16);
      let add = parseInt(lnib,16) + parseInt(unib,16);
      cpu.PC.setValue(add);
      cpu._clock.m+=4;
      cpu._clock.t+=16;
    }
    else {
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
  }
}
opcodes[212] = {
  mnemonic: "CALL NC a16",
  blength: 3,
  m_cycle: 3,
  t_cycle: 12,
  exec: function(cpu) {
    let f = cpu.F.getValue();
    let ninst = cpu.PC.getValue()+this.blength;
    if(!(f&0x10)) {
      let lnib = (ninst&0x00FF);
      let unib = (ninst&0xFF00)>>>8;
      //Push address onto stack
      cpu.SP.addValue(-1);
      cpu.mem.writeByte(cpu.SP.getValue(),unib)
      cpu.SP.addValue(-1);
      cpu.mem.writeByte(cpu.SP.getValue(),lnib)
      let lniba = '00' + cpu.mem.readByte(cpu.PC.getValue()+1).toString(16);
      let uniba = (cpu.mem.readByte(cpu.PC.getValue()+2)<<8).toString(16);
      let add = parseInt(lniba,16) + parseInt(uniba,16);
      cpu.PC.setValue(add);
      cpu._clock.m+=6;
      cpu._clock.t+=24;
    }
    else {
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
  }
}
opcodes[213] = {
  mnemonic: "PUSH DE",
  blength: 1,
  m_cycle: 4,
  t_cycle: 16,
  exec: function(cpu) {
    cpu.SP.addValue(-1);
    cpu.mem.writeByte(cpu.SP.getValue(),cpu.D.getValue())
    cpu.SP.addValue(-1);
    cpu.mem.writeByte(cpu.SP.getValue(),cpu.E.getValue())
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[214] = {
    mnemonic: "SUB d8",
    blength: 1,
    m_cycle: 2,
    t_cycle: 8,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let d8 = cpu.mem.readByte(cpu.PC.getValue()+1);
      let f = cpu.F.getValue();
      if( (a-d8) < 0 ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if(   ( (a&0x0F) - (d8&0x0F)  ) < 0 ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 1
      f |=0x40;
      cpu.A.addValue(-d8);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[215] = {
  mnemonic: "RST 10H",
  blength: 1,
  m_cycle: 4,
  t_cycle: 16,
  exec: function(cpu) {
    let lnib = (cpu.PC.getValue()&0x00FF);
    let unib = (cpu.PC.getValue()&0xFF00)>>>8;
    cpu.SP.addValue(-1);
    cpu.mem.writeByte(cpu.SP.getValue(),unib);
    cpu.SP.addValue(-1);
    cpu.mem.writeByte(cpu.SP.getValue(),lnib);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.setValue(0x0010);
  }
}
opcodes[216] = {
  mnemonic: "RET C",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue();
    if(f&0x10) {
      let lnib = '00' + cpu.mem.readByte(cpu.SP.getValue()).toString(16);
      cpu.SP.addValue(1);
      let unib = (cpu.mem.readByte(cpu.SP.getValue())<<8).toString(16);
      cpu.SP.addValue(1);
      let address = parseInt(unib, 16) + parseInt(lnib,16);
      cpu.PC.setValue(address);
      cpu._clock.m+=5;
      cpu._clock.t+=20;
    }
    else {
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
  }
}
//emable Interrupt figure out a way to do this
opcodes[217] = {
  mnemonic: "RETI",
  blength: 1,
  m_cycle: 4,
  t_cycle: 16,
  exec: function(cpu) {
    let lnib = '00' + cpu.mem.readByte(cpu.SP.getValue()).toString(16);
    cpu.SP.addValue(1);
    let unib = (cpu.mem.readByte(cpu.SP.getValue())<<8).toString(16);
    cpu.SP.addValue(1);
    let address = parseInt(unib, 16) + parseInt(lnib,16);
    cpu.PC.setValue(address);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
  }
}
opcodes[218] = {
  mnemonic: "JP C a16",
  blength: 3,
  m_cycle: 3,
  t_cycle: 12,
  exec: function(cpu) {
    let f = cpu.F.getValue();
    if(f&0x10) {
      let lnib = '00' + cpu.mem.readByte(cpu.PC.getValue()+1).toString(16);
      let unib = (cpu.mem.readByte(cpu.PC.getValue()+2)<<8).toString(16);
      let add = parseInt(lnib,16) + parseInt(unib,16);
      cpu.PC.setValue(add);
      cpu._clock.m+=4;
      cpu._clock.t+=16;
    }
    else {
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
  }
}
opcodes[220] = {
  mnemonic: "CALL C a16",
  blength: 3,
  m_cycle: 3,
  t_cycle: 12,
  exec: function(cpu) {
    let f = cpu.F.getValue();
    let ninst = cpu.PC.getValue()+this.blength;
    if(f&0x10) {
      let lnib = (ninst&0x00FF);
      let unib = (ninst&0xFF00)>>>8;
      //Push address onto stack
      cpu.SP.addValue(-1);
      cpu.mem.writeByte(cpu.SP.getValue(),unib)
      cpu.SP.addValue(-1);
      cpu.mem.writeByte(cpu.SP.getValue(),lnib)
      let lniba = '00' + cpu.mem.readByte(cpu.PC.getValue()+1).toString(16);
      let uniba = (cpu.mem.readByte(cpu.PC.getValue()+2)<<8).toString(16);
      let add = parseInt(lniba,16) + parseInt(uniba,16);
      cpu.PC.setValue(add);
      cpu._clock.m+=6;
      cpu._clock.t+=24;
    }
    else {
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
  }
}
opcodes[222] = {
    mnemonic: "SBC A, d8",
    blength: 2,
    m_cycle: 2,
    t_cycle: 8,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let d8 = cpu.mem.readByte(cpu.PC.getValue()+1);
      let f = cpu.F.getValue();
      let carry = (f&0x10)>>>4;
      if( (a-d8-carry) < 0 ) {
        f |= 0x10;
      }
      else {
        f&=0xE0;
      }
      if(   ( (a&0x0F) - (d8&0x0F) - carry  ) < 0 ) {
        f |= 0x20;
      }
      else {
        f&=0xD0;
      }
      //set N flag 1
      f |=0x40;
      cpu.A.addValue(-d8-carry);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[223] = {
  mnemonic: "RST 18H",
  blength: 1,
  m_cycle: 4,
  t_cycle: 16,
  exec: function(cpu) {
    let lnib = (cpu.PC.getValue()&0x00FF);
    let unib = (cpu.PC.getValue()&0xFF00)>>>8;
    cpu.SP.addValue(-1);
    cpu.mem.writeByte(cpu.SP.getValue(),unib);
    cpu.SP.addValue(-1);
    cpu.mem.writeByte(cpu.SP.getValue(),lnib);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.setValue(0x0018);
  }
}
opcodes[224] = {
  mnemonic: "LD ($FF00+a8), A",
  blength:2,
  m_cycle:3,
  t_cycle:12,
  exec: function(cpu) {
    let a8 = cpu.mem.readByte(cpu.PC.getValue()+1);
    cpu.mem.writeByte(0xFF00+a8, cpu.A.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[225] = {
  mnemonic: "POP HL",
  blength: 1,
  m_cycle: 3,
  t_cycle: 12,
  exec: function(cpu) {
    let lnib = '00' + cpu.mem.readByte(cpu.SP.getValue()).toString(16);
    cpu.SP.addValue(1);
    cpu.L.setValue(parseInt(lnib,16));
    let unib = '00' + cpu.mem.readByte(cpu.SP.getValue()).toString(16);
    cpu.SP.addValue(1);
    cpu.H.setValue(parseInt(unib, 16));
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[226] = {
  mnemonic: "LD ($FF00+C), A",
  blength:1,
  m_cycle:2,
  t_cycle:8,
  exec: function(cpu) {
    let a8 = cpu.mem.readByte(cpu.PC.getValue()+1);
    cpu.mem.writeByte(0xFF00+cpu.C.getValue(), cpu.A.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[229] = {
  mnemonic: "PUSH HL",
  blength: 1,
  m_cycle: 4,
  t_cycle: 16,
  exec: function(cpu) {
    cpu.SP.addValue(-1);
    cpu.mem.writeByte(cpu.SP.getValue(),cpu.H.getValue())
    cpu.SP.addValue(-1);
    cpu.mem.writeByte(cpu.SP.getValue(),cpu.L.getValue())
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[230] = {
    mnemonic: "AND d8",
    blength: 2,
    m_cycle: 2,
    t_cycle: 8,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let d8 = cpu.mem.readByte(cpu.PC.getValue()+1);
      let f = cpu.F.getValue();
      f|=0x20;
      f&=0xA0;
      cpu.A.setValue(a&d8);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[231] = {
  mnemonic: "RST 20H",
  blength: 1,
  m_cycle: 4,
  t_cycle: 16,
  exec: function(cpu) {
    let lnib = (cpu.PC.getValue()&0x00FF);
    let unib = (cpu.PC.getValue()&0xFF00)>>>8;
    cpu.SP.addValue(-1);
    cpu.mem.writeByte(cpu.SP.getValue(),unib);
    cpu.SP.addValue(-1);
    cpu.mem.writeByte(cpu.SP.getValue(),lnib);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.setValue(0x0020);
  }
}
opcodes[232] = {
  mnemonic: "Add SP, r8",
  blength: 2,
  m_cycle: 4,
  t_cycle: 16,
  exec: function(cpu) {
    // 0 0 H C
    let f = cpu.F.getValue();
    let SP = cpu.SP.getValue();
    let r8 = new Int8Array(1);
    r8[0] = cpu.mem.readByte(cpu.PC.getValue()+1);


    if(  ((SP + r8) > 0xFFFF) | ((SP + r8) < 0) ) {
      //Carry flag
      f |= 0x10;
    }
    else {
      f &= 0xE0;
    }

    if( ((SP&0x0FFF) + r8) > 0x0FFF ) {
      // Half Carry Flag
      f |= 0x20;
    }
    else {
      f &= 0xD0;
    }
    //0 subtract flag and zero flag
    f &=0xB0;
    f &=0x70;
    cpu.F.setValue(f);
    cpu.SP.addValue(r8[0]);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[233] = {
  mnemonic: "JP HL",
  blength: 1,
  m_cycle: 1,
  t_cycle: 4,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    cpu.PC.setValue(HL);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
  }
}
opcodes[234] = {
  mnemonic: "LD (a16), A",
  blength:3,
  m_cycle:4,
  t_cycle:16,
  exec: function(cpu) {
    let lnib = '00' + cpu.mem.readByte(cpu.PC.getValue()+1).toString(16);
    let unib = (cpu.mem.readByte(cpu.PC.getValue()+2)<<8).toString(16);
    let a16 = parseInt(lnib,16) + parseInt(unib,16);
    cpu.mem.writeByte(a16, cpu.A.getValue());
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[238] = {
    mnemonic: "XOR d8",
    blength: 2,
    m_cycle: 2,
    t_cycle: 8,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let d8 = cpu.mem.readByte(cpu.PC.getValue()+1);
      let f = cpu.F.getValue();
      f&=0x80;
      cpu.A.setValue(a^d8);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[239] = {
  mnemonic: "RST 28H",
  blength: 1,
  m_cycle: 4,
  t_cycle: 16,
  exec: function(cpu) {
    let lnib = (cpu.PC.getValue()&0x00FF);
    let unib = (cpu.PC.getValue()&0xFF00)>>>8;
    cpu.SP.addValue(-1);
    cpu.mem.writeByte(cpu.SP.getValue(),unib);
    cpu.SP.addValue(-1);
    cpu.mem.writeByte(cpu.SP.getValue(),lnib);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.setValue(0x0000);
  }
}
opcodes[240] = {
  mnemonic: "LD A, ($FF00+a8)",
  blength:2,
  m_cycle:3,
  t_cycle:12,
  exec: function(cpu) {
    let a8 = cpu.mem.readByte(cpu.PC.getValue()+1);
    cpu.A.setValue(cpu.mem.readByte(0xFF00+a8));
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[241] = {
  mnemonic: "POP AF",
  blength: 1,
  m_cycle: 3,
  t_cycle: 12,
  exec: function(cpu) {
    let lnib = '00' + cpu.mem.readByte(cpu.SP.getValue()).toString(16);
    cpu.SP.addValue(1);
    cpu.F.setValue(parseInt(lnib,16));
    let unib = '00' + cpu.mem.readByte(cpu.SP.getValue()).toString(16);
    cpu.SP.addValue(1);
    cpu.A.setValue(parseInt(unib, 16));
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[242] = {
  mnemonic: "LD A ($FF00+C)",
  blength:1,
  m_cycle:2,
  t_cycle:8,
  exec: function(cpu) {
    cpu.A.setValue(cpu.mem.readByte(0xFF00+cpu.C.getValue()));
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[243] = {
  mnemonic: "DI",
  blength:1,
  m_cycle:1,
  t_cycle:4,
  exec: function(cpu) {
    //DIsable Interrupt after next instruction
  }
}
opcodes[245] = {
  mnemonic: "PUSH AF",
  blength: 1,
  m_cycle: 4,
  t_cycle: 16,
  exec: function(cpu) {
    cpu.SP.addValue(-1);
    cpu.mem.writeByte(cpu.SP.getValue(),cpu.A.getValue())
    cpu.SP.addValue(-1);
    cpu.mem.writeByte(cpu.SP.getValue(),cpu.F.getValue())
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[246] = {
    mnemonic: "OR d8",
    blength: 2,
    m_cycle: 2,
    t_cycle: 8,
    exec: function(cpu) {
      let a = cpu.A.getValue();
      let d8 = cpu.mem.readByte(cpu.PC.getValue()+1);
      let f = cpu.F.getValue();
      f&=0x80;
      cpu.A.setValue(a|d8);
      if(cpu.A.getValue() == 0) {
        f |= 0x80;
      }
      else {
        f &= 0x70;
      }
      cpu.F.setValue(f);
      cpu._clock.m+=this.m_cycle;
      cpu._clock.t+=this.t_cycle;
      cpu.PC.addValue(this.blength);
    }
}
opcodes[247] = {
  mnemonic: "RST 30H",
  blength: 1,
  m_cycle: 4,
  t_cycle: 16,
  exec: function(cpu) {
    let lnib = (cpu.PC.getValue()&0x00FF);
    let unib = (cpu.PC.getValue()&0xFF00)>>>8;
    cpu.SP.addValue(-1);
    cpu.mem.writeByte(cpu.SP.getValue(),unib);
    cpu.SP.addValue(-1);
    cpu.mem.writeByte(cpu.SP.getValue(),lnib);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.setValue(0x0030);
  }
}
opcodes[248] = {
  mnemonic: "LD HL, SP+r8",
  blength: 2,
  m_cycle: 4,
  t_cycle: 16,
  exec: function(cpu) {
    // 0 0 H C
    let f = cpu.F.getValue();
    let SP = cpu.SP.getValue();
    let r8 = new Int8Array(1);
    r8[0] = cpu.mem.readByte(cpu.PC.getValue()+1);


    if(  ((SP + r8) > 0xFFFF) | ((SP + r8) < 0) ) {
      //Carry flag
      f |= 0x10;
    }
    else {
      f &= 0xE0;
    }

    if( ((SP&0x0FFF) + r8) > 0x0FFF ) {
      // Half Carry Flag
      f |= 0x20;
    }
    else {
      f &= 0xD0;
    }
    //0 subtract flag and zero flag
    f &=0xB0;
    f &=0x70;
    cpu.F.setValue(f);
    cpu.L.setValue((SP+r8[0])&0x00FF);
    cpu.H.setValue(((SP+r8[0])&0xFF00)>>>8);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[249] = {
  mnemonic: "LD HL, SP",
  blength: 1,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let SP = cpu.SP.getValue();
    cpu.L.setValue(SP&0x00FF);
    cpu.H.setValue((SP&0xFF00)>>>8);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[250] = {
  mnemonic: "LD A, (a16)",
  blength: 3,
  m_cycle: 4,
  t_cycle: 16,
  exec: function(cpu) {
    let lnib = '00' + cpu.mem.readByte(cpu.PC.getValue()+1).toString(16);
    let unib = (cpu.mem.readByte(cpu.PC.getValue()+2)<<8).toString(16);
    let a16 = parseInt(lnib,16) + parseInt(unib,16);
    cpu.A.setValue(cpu.mem.readByte(a16));
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[251] = {
  mnemonic: "EI",
  blength:1,
  m_cycle:1,
  t_cycle:4,
  exec: function(cpu) {
    //ENABLE Interrupt after next instruction
  }
}
opcodes[254] = {
  mnemonic: "CP d8",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let a = cpu.A.getValue();
    let d8 = cpu.mem.readByte(cpu.PC.getValue()+1);
    let f = cpu.F.getValue();
    if( (a-d8) < 0 ) {
      f |= 0x10;
    }
    else {
      f&=0xE0;
    }
    if(   ( (a&0x0F) - (d8&0x0F)  ) < 0 ) {
      f |= 0x20;
    }
    else {
      f&=0xD0;
    }
    //set N flag 1
    f |=0x40;
    if(a == d8) {
      f |= 0x80;
    }
    else {
      f &= 0x70;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes[255] = {
  mnemonic: "RST 38H",
  blength: 1,
  m_cycle: 4,
  t_cycle: 16,
  exec: function(cpu) {
    let lnib = (cpu.PC.getValue()&0x00FF);
    let unib = (cpu.PC.getValue()&0xFF00)>>>8;
    cpu.SP.addValue(-1);
    cpu.mem.writeByte(cpu.SP.getValue(),unib);
    cpu.SP.addValue(-1);
    cpu.mem.writeByte(cpu.SP.getValue(),lnib);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.setValue(0x0038);
  }
}
opcodes_CB[0] = {
  mnemonic: "RLC B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let b = cpu.B.getValue();
    let end = b&0x80;
    if(end) {
      f |=0x10;
      cpu.B.setValue( ((b<<1)&0xFF)|0x01 );
    }
    else {
      cpu.B.setValue( (b<<1)&0xFF);
    }
    if(cpu.B.getValue()==0) {
      f |=0x80;
    }

    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[1] = {
  mnemonic: "RLC C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let c = cpu.C.getValue();
    let end = c&0x80;
    if(end) {
      f |=0x10;
      cpu.C.setValue( ((c<<1)&0xFF)|0x01 );
    }
    else {
      cpu.C.setValue( (c<<1)&0xFF);
    }
    if(cpu.C.getValue()==0) {
      f |=0x80;
    }

    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[2] = {
  mnemonic: "RLC D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let d = cpu.D.getValue();
    let end = d&0x80;
    if(end) {
      f |=0x10;
      cpu.D.setValue( ((d<<1)&0xFF)|0x01 );
    }
    else {
      cpu.D.setValue( (d<<1)&0xFF);
    }
    if(cpu.D.getValue()==0) {
      f |=0x80;
    }

    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[3] = {
  mnemonic: "RLC E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let e = cpu.E.getValue();
    let end = e&0x80;
    if(end) {
      f |=0x10;
      cpu.E.setValue( ((e<<1)&0xFF)|0x01 );
    }
    else {
      cpu.E.setValue( (e<<1)&0xFF);
    }
    if(cpu.E.getValue()==0) {
      f |=0x80;
    }

    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[4] = {
  mnemonic: "RLC H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let h = cpu.H.getValue();
    let end = h&0x80;
    if(end) {
      f |=0x10;
      cpu.H.setValue( ((h<<1)&0xFF)|0x01 );
    }
    else {
      cpu.H.setValue( (h<<1)&0xFF);
    }
    if(cpu.H.getValue()==0) {
      f |=0x80;
    }

    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[5] = {
  mnemonic: "RLC L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let l = cpu.L.getValue();
    let end = l&0x80;
    if(end) {
      f |=0x10;
      cpu.L.setValue( ((l<<1)&0xFF)|0x01 );
    }
    else {
      cpu.L.setValue( (l<<1)&0xFF);
    }
    if(cpu.L.getValue()==0) {
      f |=0x80;
    }

    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[6] = {
  mnemonic: "RLC (HL)",
  blength: 2,
  m_cycle: 4,
  t_cycle: 16,
  exec: function(cpu) {
    let f = 0x00;
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let hl_v = cpu.mem.readByte(HL);
    let end = hl_v&0x80;
    if(end) {
      f |=0x10;
      cpu.mem.writeByte(HL, ((hl_v<<1)&0xFF)|0x01 );
    }
    else {
      cpu.mem.writeByte(HL, (hl_v<<1)&0xFF);
    }
    if(cpu.mem.readByte(HL)==0) {
      f |=0x80;
    }

    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[7] = {
  mnemonic: "RLC A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let a = cpu.A.getValue();
    let end = a&0x80;
    if(end) {
      f |=0x10;
      cpu.A.setValue( ((a<<1)&0xFF)|0x01 );
    }
    else {
      cpu.A.setValue( (a<<1)&0xFF);
    }
    if(cpu.A.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[8] = {
  mnemonic: "RRC B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let b = cpu.B.getValue();
    let end = b&0x01;
    if(end) {
      f |=0x10;
      cpu.B.setValue( ((b>>1)&0xFF)|0x80 );
    }
    else {
      cpu.B.setValue( (b>>1)&0xFF);
    }

    if(cpu.B.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[9] = {
  mnemonic: "RRC C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let c = cpu.C.getValue();
    let end = c&0x01;
    if(end) {
      f |=0x10;
      cpu.C.setValue( ((c>>1)&0xFF)|0x80 );
    }
    else {
      cpu.C.setValue( (c>>1)&0xFF);
    }

    if(cpu.C.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[10] = {
  mnemonic: "RRC D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let d = cpu.D.getValue();
    let end = d&0x01;
    if(end) {
      f |=0x10;
      cpu.D.setValue( ((d>>1)&0xFF)|0x80 );
    }
    else {
      cpu.D.setValue( (d>>1)&0xFF);
    }

    if(cpu.D.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[11] = {
  mnemonic: "RRC E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let e = cpu.E.getValue();
    let end = e&0x01;
    if(end) {
      f |=0x10;
      cpu.E.setValue( ((e>>1)&0xFF)|0x80 );
    }
    else {
      cpu.E.setValue( (e>>1)&0xFF);
    }

    if(cpu.E.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[12] = {
  mnemonic: "RRC H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let h = cpu.H.getValue();
    let end = h&0x01;
    if(end) {
      f |=0x10;
      cpu.H.setValue( ((h>>1)&0xFF)|0x80 );
    }
    else {
      cpu.H.setValue( (h>>1)&0xFF);
    }

    if(cpu.H.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[13] = {
  mnemonic: "RRC L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let l = cpu.L.getValue();
    let end = l&0x01;
    if(end) {
      f |=0x10;
      cpu.L.setValue( ((l>>1)&0xFF)|0x80 );
    }
    else {
      cpu.L.setValue( (l>>1)&0xFF);
    }

    if(cpu.L.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[14] = {
  mnemonic: "RRC (HL)",
  blength: 2,
  m_cycle: 4,
  t_cycle: 16,
  exec: function(cpu) {
    let f = 0x00;
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let hl_v = cpu.mem.readByte(HL);
    let end = hl_v&0x01;
    if(end) {
      f |=0x10;
      cpu.mem.writeByte(HL, ((hl_v>>1)&0xFF)|0x80 );
    }
    else {
      cpu.mem.writeByte(HL, (hl_v>>1)&0xFF);
    }
    if(cpu.mem.readByte(HL)==0) {
      f |=0x80;
    }

    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[15] = {
  mnemonic: "RRC A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let a = cpu.A.getValue();
    let end = a&0x01;
    if(end) {
      f |=0x10;
      cpu.A.setValue( ((a>>1)&0xFF)|0x80 );
    }
    else {
      cpu.A.setValue( (a>>1)&0xFF);
    }

    if(cpu.A.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[16] = {
  mnemonic: "RL B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let c = (cpu.F.getValue()&0x10)>>4;
    let b = cpu.B.getValue();
    let end = b&0x80;
    if(end) {
      f |=0x10;
      cpu.B.setValue( ((b<<1)&0xFF)|c);
    }
    else {
      cpu.B.setValue( (b<<1)&0xFF|c);
    }
    if(cpu.B.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[17] = {
  mnemonic: "RL C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let cr = (cpu.F.getValue()&0x10)>>4;
    let c = cpu.C.getValue();
    let end = c&0x80;
    if(end) {
      f |=0x10;
      cpu.C.setValue( ((c<<1)&0xFF)|cr);
    }
    else {
      cpu.C.setValue( (c<<1)&0xFF|cr);
    }
    if(cpu.C.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[18] = {
  mnemonic: "RL D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let c = (cpu.F.getValue()&0x10)>>4;
    let d = cpu.D.getValue();
    let end = d&0x80;
    if(end) {
      f |=0x10;
      cpu.D.setValue( ((d<<1)&0xFF)|c);
    }
    else {
      cpu.D.setValue( (d<<1)&0xFF|c);
    }
    if(cpu.D.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[19] = {
  mnemonic: "RL E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let c = (cpu.F.getValue()&0x10)>>4;
    let e = cpu.E.getValue();
    let end = e&0x80;
    if(end) {
      f |=0x10;
      cpu.E.setValue( ((e<<1)&0xFF)|c);
    }
    else {
      cpu.E.setValue( (e<<1)&0xFF|c);
    }

    if(cpu.E.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[20] = {
  mnemonic: "RL H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let c = (cpu.F.getValue()&0x10)>>4;
    let h = cpu.H.getValue();
    let end = h&0x80;
    if(end) {
      f |=0x10;
      cpu.H.setValue( ((h<<1)&0xFF)|c);
    }
    else {
      cpu.H.setValue( (h<<1)&0xFF|c);
    }
    if(cpu.H.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[21] = {
  mnemonic: "RL L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let c = (cpu.F.getValue()&0x10)>>4;
    let l = cpu.L.getValue();
    let end = l&0x80;
    if(end) {
      f |=0x10;
      cpu.L.setValue( ((l<<1)&0xFF)|c);
    }
    else {
      cpu.L.setValue( (l<<1)&0xFF|c);
    }
    if(cpu.L.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[22] = {
  mnemonic: "RL (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let c = (cpu.F.getValue()&0x10)>>4;
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let hl_v = cpu.mem.readByte(HL);
    let end = hl_v&0x80;
    if(end) {
      f |=0x10;
      cpu.mem.writeByte(HL,((hl_v<<1)&0xFF)|c);
    }
    else {
      cpu.mem.writeByte(HL,(hl_v<<1)&0xFF|c);
    }
    if(cpu.mem.readByte(HL)==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[23] = {
  mnemonic: "RL A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let c = (cpu.F.getValue()&0x10)>>4;
    let a = cpu.A.getValue();
    let end = a&0x80;
    if(end) {
      f |=0x10;
      cpu.A.setValue( ((a<<1)&0xFF)|c);
    }
    else {
      cpu.A.setValue( ((a<<1)&0xFF)|c);
    }
    if(cpu.A.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[24] = {
  mnemonic: "RR B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let c = (cpu.F.getValue()&0x10)<<3;
    let b = cpu.B.getValue();
    let end = b&0x01;
    if(end) {
      f |=0x10;
      cpu.B.setValue(((b>>1)&0xFF)|c);
    }
    else {
      cpu.B.setValue(((b>>1)&0xFF)|c);
    }
    if(cpu.B.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[25] = {
  mnemonic: "RR C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let cr = (cpu.F.getValue()&0x10)<<3;
    let c = cpu.C.getValue();
    let end = c&0x01;
    if(end) {
      f |=0x10;
      cpu.C.setValue(((c>>1)&0xFF)|cr);
    }
    else {
      cpu.C.setValue(((c>>1)&0xFF)|cr);
    }
    if(cpu.C.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[26] = {
  mnemonic: "RR D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let c = (cpu.F.getValue()&0x10)<<3;
    let d = cpu.D.getValue();
    let end = d&0x01;
    if(end) {
      f |=0x10;
      cpu.D.setValue(((d>>1)&0xFF)|c);
    }
    else {
      cpu.D.setValue(((d>>1)&0xFF)|c);
    }
    if(cpu.D.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[27] = {
  mnemonic: "RR E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let c = (cpu.F.getValue()&0x10)<<3;
    let e = cpu.E.getValue();
    let end = e&0x01;
    if(end) {
      f |=0x10;
      cpu.E.setValue(((e>>1)&0xFF)|c);
    }
    else {
      cpu.E.setValue(((e>>1)&0xFF)|c);
    }
    if(cpu.E.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[28] = {
  mnemonic: "RR H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let c = (cpu.F.getValue()&0x10)<<3;
    let h = cpu.H.getValue();
    let end = h&0x01;
    if(end) {
      f |=0x10;
      cpu.H.setValue(((h>>1)&0xFF)|c);
    }
    else {
      cpu.H.setValue(((h>>1)&0xFF)|c);
    }
    if(cpu.H.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[29] = {
  mnemonic: "RR L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let c = (cpu.F.getValue()&0x10)<<3;
    let l = cpu.L.getValue();
    let end = l&0x01;
    if(end) {
      f |=0x10;
      cpu.L.setValue(((l>>1)&0xFF)|c);
    }
    else {
      cpu.L.setValue(((l>>1)&0xFF)|c);
    }
    if(cpu.L.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[30] = {
  mnemonic: "RR (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let c = (cpu.F.getValue()&0x10)<<3;
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let hl_v = cpu.mem.readByte(HL);
    let end = hl_v&0x80;
    if(end) {
      f |=0x10;
      cpu.mem.writeByte(HL,((hl_v>>1)&0xFF)|c);
    }
    else {
      cpu.mem.writeByte(HL,(hl_v>>1)&0xFF|c);
    }
    if(cpu.mem.readByte(HL)==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[31] = {
  mnemonic: "RR A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let c = (cpu.F.getValue()&0x10)<<3;
    let a = cpu.A.getValue();
    let end = a&0x01;
    if(end) {
      f |=0x10;
      cpu.A.setValue(((a>>1)&0xFF)|c);
    }
    else {
      cpu.A.setValue(((a>>1)&0xFF)|c);
    }
    if(cpu.A.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[32] = {
  mnemonic: "SLA B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let b = cpu.B.getValue();
    let end = b&0x80;
    if(end) {
      f |=0x10;
      cpu.B.setValue((b<<1)&0xFE);
    }
    else {
      cpu.B.setValue((b<<1)&0xFE);
    }
    if(cpu.B.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[33] = {
  mnemonic: "SLA C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let c = cpu.C.getValue();
    let end = c&0x80;
    if(end) {
      f |=0x10;
      cpu.C.setValue((c<<1)&0xFE);
    }
    else {
      cpu.C.setValue((c<<1)&0xFE);
    }
    if(cpu.C.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[34] = {
  mnemonic: "SLA D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let d = cpu.D.getValue();
    let end = d&0x80;
    if(end) {
      f |=0x10;
      cpu.D.setValue((d<<1)&0xFE);
    }
    else {
      cpu.D.setValue((d<<1)&0xFE);
    }
    if(cpu.D.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[35] = {
  mnemonic: "SLA E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let e = cpu.E.getValue();
    let end = e&0x80;
    if(end) {
      f |=0x10;
      cpu.E.setValue((e<<1)&0xFE);
    }
    else {
      cpu.E.setValue((e<<1)&0xFE);
    }
    if(cpu.E.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[36] = {
  mnemonic: "SLA H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let h = cpu.H.getValue();
    let end = h&0x80;
    if(end) {
      f |=0x10;
      cpu.H.setValue((h<<1)&0xFE);
    }
    else {
      cpu.H.setValue((h<<1)&0xFE);
    }
    if(cpu.H.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[37] = {
  mnemonic: "SLA L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let l = cpu.L.getValue();
    let end = l&0x80;
    if(end) {
      f |=0x10;
      cpu.L.setValue((l<<1)&0xFE);
    }
    else {
      cpu.L.setValue((l<<1)&0xFE);
    }
    if(cpu.L.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[38] = {
  mnemonic: "SLA (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let hl_v = cpu.mem.readByte(HL);
    let end = hl_v&0x80;
    if(end) {
      f |=0x10;
      cpu.mem.writeByte(HL,(hl_v<<1)&0xFE);
    }
    else {
      cpu.mem.writeByte(HL,(hl_v<<1)&0xFE);
    }
    if(cpu.mem.readByte(HL)==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[39] = {
  mnemonic: "SLA A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let a = cpu.A.getValue();
    let end = a&0x80;
    if(end) {
      f |=0x10;
      cpu.A.setValue((a<<1)&0xFE);
    }
    else {
      cpu.A.setValue((a<<1)&0xFE);
    }
    if(cpu.A.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[40] = {
  mnemonic: "SRA B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let c = cpu.B.getValue()&0x80;
    let b = cpu.B.getValue();
    let end = b&0x01;
    if(end) {
      f |=0x10;
      cpu.B.setValue(((b>>1)&0xFF)|c);
    }
    else {
      cpu.B.setValue(((b>>1)&0xFF)|c);
    }
    if(cpu.B.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[41] = {
  mnemonic: "SRA C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let cr = cpu.C.getValue()&0x80;
    let c = cpu.C.getValue();
    let end = c&0x01;
    if(end) {
      f |=0x10;
      cpu.C.setValue(((c>>1)&0xFF)|cr);
    }
    else {
      cpu.C.setValue(((c>>1)&0xFF)|cr);
    }
    if(cpu.C.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[42] = {
  mnemonic: "SRA D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let c = cpu.D.getValue()&0x80;
    let d = cpu.D.getValue();
    let end = d&0x01;
    if(end) {
      f |=0x10;
      cpu.D.setValue(((d>>1)&0xFF)|c);
    }
    else {
      cpu.D.setValue(((d>>1)&0xFF)|c);
    }
    if(cpu.D.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[43] = {
  mnemonic: "SRA E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let c = cpu.E.getValue()&0x80;
    let e = cpu.E.getValue();
    let end = e&0x01;
    if(end) {
      f |=0x10;
      cpu.E.setValue(((e>>1)&0xFF)|c);
    }
    else {
      cpu.E.setValue(((e>>1)&0xFF)|c);
    }
    if(cpu.D.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[44] = {
  mnemonic: "SRA H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let c = cpu.H.getValue()&0x80;
    let h = cpu.H.getValue();
    let end = h&0x01;
    if(end) {
      f |=0x10;
      cpu.H.setValue(((h>>1)&0xFF)|c);
    }
    else {
      cpu.H.setValue(((h>>1)&0xFF)|c);
    }
    if(cpu.H.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[45] = {
  mnemonic: "SRA L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let c = cpu.L.getValue()&0x80;
    let l = cpu.L.getValue();
    let end = l&0x01;
    if(end) {
      f |=0x10;
      cpu.L.setValue(((l>>1)&0xFF)|c);
    }
    else {
      cpu.L.setValue(((l>>1)&0xFF)|c);
    }
    if(cpu.L.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[46] = {
  mnemonic: "SRA (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let hl_v = cpu.mem.readByte(HL);
    let end = hl_v&0x01;
    let c = hl_v&0x80;
    if(end) {
      f |=0x10;
      cpu.mem.writeByte(HL,((hl_v>>1)&0xFF)|c);
    }
    else {
      cpu.mem.writeByte(HL,((hl_v>>1)&0xFF)|c);
    }
    if(cpu.mem.readByte(HL)==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[47] = {
  mnemonic: "SRA A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let c = cpu.A.getValue()&0x80;
    let a = cpu.A.getValue();
    let end = a&0x01;
    if(end) {
      f |=0x10;
      cpu.A.setValue(((a>>1)&0xFF)|c);
    }
    else {
      cpu.A.setValue(((a>>1)&0xFF)|c);
    }
    if(cpu.A.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[48] = {
  mnemonic: "SWAP B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let swap =  ((cpu.B.getValue()&0x0F)<<4)|((cpu.B.getValue()&0xF0)>>4);
    cpu.B.setValue(swap);
    if(cpu.B.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[49] = {
  mnemonic: "SWAP C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let swap =  ((cpu.C.getValue()&0x0F)<<4)|((cpu.C.getValue()&0xF0)>>4);
    cpu.C.setValue(swap);
    if(cpu.C.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[50] = {
  mnemonic: "SWAP D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let swap =  ((cpu.D.getValue()&0x0F)<<4)|((cpu.D.getValue()&0xF0)>>4);
    cpu.D.setValue(swap);
    if(cpu.D.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[51] = {
  mnemonic: "SWAP E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let swap =  ((cpu.E.getValue()&0x0F)<<4)|((cpu.E.getValue()&0xF0)>>4);
    cpu.E.setValue(swap);
    if(cpu.E.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[52] = {
  mnemonic: "SWAP H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let swap =  ((cpu.H.getValue()&0x0F)<<4)|((cpu.H.getValue()&0xF0)>>4);
    cpu.H.setValue(swap);
    if(cpu.H.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[53] = {
  mnemonic: "SWAP L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let swap =  ((cpu.L.getValue()&0x0F)<<4)|((cpu.L.getValue()&0xF0)>>4);
    cpu.L.setValue(swap);
    if(cpu.L.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[54] = {
  mnemonic: "SWAP (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = cpu.mem.readByte(HL);
    let swap = ((val&0x0F)<<4)|((val&0xF0)>>4);
    cpu.mem.writeByte(HL,swap);
    if( cpu.mem.readByte(HL)==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[55] = {
  mnemonic: "SWAP A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let swap =  ((cpu.A.getValue()&0x0F)<<4)|((cpu.A.getValue()&0xF0)>>4);
    cpu.A.setValue(swap);
    if(cpu.A.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[56] = {
  mnemonic: "SRL B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let b = cpu.B.getValue();
    let end = b&0x01;
    if(end) {
      f |=0x10;
    }
    cpu.B.setValue((b>>1)&0x7F);
    if(cpu.B.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[57] = {
  mnemonic: "SRL C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let c = cpu.C.getValue();
    let end = c&0x01;
    if(end) {
      f |=0x10;
    }
    cpu.C.setValue((c>>1)&0x7F);
    if(cpu.C.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[58] = {
  mnemonic: "SRL D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let d = cpu.D.getValue();
    let end = d&0x01;
    if(end) {
      f |=0x10;
    }
    cpu.D.setValue((d>>1)&0x7F);
    if(cpu.D.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[59] = {
  mnemonic: "SRL E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let e = cpu.E.getValue();
    let end = e&0x01;
    if(end) {
      f |=0x10;
    }
    cpu.E.setValue((e>>1)&0x7F);
    if(cpu.E.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[60] = {
  mnemonic: "SRL H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let h = cpu.H.getValue();
    let end = h&0x01;
    if(end) {
      f |=0x10;
    }
    cpu.H.setValue((h>>1)&0x7F);
    if(cpu.H.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[61] = {
  mnemonic: "SRL L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let l = cpu.L.getValue();
    let end = l&0x01;
    if(end) {
      f |=0x10;
    }
    cpu.L.setValue((l>>1)&0x7F);
    if(cpu.l.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[62] = {
  mnemonic: "SRL (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = cpu.mem.readByte(HL);
    let end = val&0x01;
    if(end) {
      f |=0x10;
    }
    cpu.mem.writeByte(HL,(val>>1)&0x7F);
    if(cpu.mem.readByte(HL)==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[63] = {
  mnemonic: "SRL A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = 0x00;
    let a = cpu.A.getValue();
    let end = a&0x01;
    if(end) {
      f |=0x10;
    }
    cpu.A.setValue((a>>1)&0x7F);
    if(cpu.A.getValue()==0) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[64] = {
  mnemonic: "BIT 0, B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.B.getValue()&0x01;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[65] = {
  mnemonic: "BIT 0, C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.C.getValue()&0x01;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[66] = {
  mnemonic: "BIT 0, D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.D.getValue()&0x01;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[67] = {
  mnemonic: "BIT 0, E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.E.getValue()&0x01;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[68] = {
  mnemonic: "BIT 0, H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.H.getValue()&0x01;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[69] = {
  mnemonic: "BIT 0, L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.L.getValue()&0x01;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[70] = {
  mnemonic: "BIT 0, (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = cpu.mem.readByte(HL);
    let tbit = val&0x01;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[71] = {
  mnemonic: "BIT 0, A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.A.getValue()&0x01;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[72] = {
  mnemonic: "BIT 1, B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.B.getValue()&0x02;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[73] = {
  mnemonic: "BIT 1, C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.C.getValue()&0x02;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[74] = {
  mnemonic: "BIT 1, D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.D.getValue()&0x02;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[75] = {
  mnemonic: "BIT 1, E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.E.getValue()&0x02;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[76] = {
  mnemonic: "BIT 1, H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.H.getValue()&0x02;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[77] = {
  mnemonic: "BIT 1, L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.L.getValue()&0x02;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[78] = {
  mnemonic: "BIT 1, (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = cpu.mem.readByte(HL);
    let tbit = val&0x02;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[79] = {
  mnemonic: "BIT 1, A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.A.getValue()&0x02;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[80] = {
  mnemonic: "BIT 2, B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.B.getValue()&0x04;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[81] = {
  mnemonic: "BIT 2, C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.C.getValue()&0x04;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[82] = {
  mnemonic: "BIT 2, D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.D.getValue()&0x04;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[83] = {
  mnemonic: "BIT 2, E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.E.getValue()&0x04;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[84] = {
  mnemonic: "BIT 2, H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.H.getValue()&0x04;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[85] = {
  mnemonic: "BIT 2, L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.L.getValue()&0x04;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[86] = {
  mnemonic: "BIT 2, (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = cpu.mem.readByte(HL);
    let tbit = val&0x04;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[87] = {
  mnemonic: "BIT 2, A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.A.getValue()&0x04;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[88] = {
  mnemonic: "BIT 3, B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.B.getValue()&0x08;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[89] = {
  mnemonic: "BIT 3, C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.C.getValue()&0x08;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[90] = {
  mnemonic: "BIT 3, D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.D.getValue()&0x08;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[91] = {
  mnemonic: "BIT 3, E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.E.getValue()&0x08;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[92] = {
  mnemonic: "BIT 3, H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.H.getValue()&0x08;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[93] = {
  mnemonic: "BIT 3, L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.L.getValue()&0x08;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[94] = {
  mnemonic: "BIT 3, (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = cpu.mem.readByte(HL);
    let tbit = val&0x08;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[95] = {
  mnemonic: "BIT 3, A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.A.getValue()&0x08;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[96] = {
  mnemonic: "BIT 4, B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.B.getValue()&0x10;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[97] = {
  mnemonic: "BIT 4, C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.C.getValue()&0x10;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[98] = {
  mnemonic: "BIT 4, D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.D.getValue()&0x10;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[99] = {
  mnemonic: "BIT 4, E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.E.getValue()&0x10;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[100] = {
  mnemonic: "BIT 4, H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.H.getValue()&0x10;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[101] = {
  mnemonic: "BIT 4, L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.L.getValue()&0x10;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[102] = {
  mnemonic: "BIT 4, (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = cpu.mem.readByte(HL);
    let tbit = val&0x10;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[103] = {
  mnemonic: "BIT 4, A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.A.getValue()&0x10;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[104] = {
  mnemonic: "BIT 5, B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.B.getValue()&0x20;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[105] = {
  mnemonic: "BIT 5, C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.C.getValue()&0x20;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[106] = {
  mnemonic: "BIT 5, D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.D.getValue()&0x20;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[107] = {
  mnemonic: "BIT 5, E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.E.getValue()&0x20;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[108] = {
  mnemonic: "BIT 5, H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.H.getValue()&0x20;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[109] = {
  mnemonic: "BIT 5, L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.L.getValue()&0x20;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[110] = {
  mnemonic: "BIT 5, (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = cpu.mem.readByte(HL);
    let tbit = val&0x20;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[111] = {
  mnemonic: "BIT 5, A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.A.getValue()&0x20;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[112] = {
  mnemonic: "BIT 6, B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.B.getValue()&0x40;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[113] = {
  mnemonic: "BIT 6, C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.C.getValue()&0x40;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[114] = {
  mnemonic: "BIT 6, D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.D.getValue()&0x40;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[115] = {
  mnemonic: "BIT 6, E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.E.getValue()&0x40;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[116] = {
  mnemonic: "BIT 6, H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.H.getValue()&0x40;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[117] = {
  mnemonic: "BIT 6, L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.L.getValue()&0x40;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[118] = {
  mnemonic: "BIT 6, (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = cpu.mem.readByte(HL);
    let tbit = val&0x40;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[119] = {
  mnemonic: "BIT 6, A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.A.getValue()&0x40;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[120] = {
  mnemonic: "BIT 7, B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.B.getValue()&0x80;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[121] = {
  mnemonic: "BIT 7, C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.C.getValue()&0x80;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[122] = {
  mnemonic: "BIT 7, D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.D.getValue()&0x80;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[123] = {
  mnemonic: "BIT 7, E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.E.getValue()&0x80;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[124] = {
  mnemonic: "BIT 7, H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.H.getValue()&0x80;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[125] = {
  mnemonic: "BIT 7, L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.L.getValue()&0x80;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[126] = {
  mnemonic: "BIT 7, (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = cpu.mem.readByte(HL);
    let tbit = val&0x80;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[127] = {
  mnemonic: "BIT 7, A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let f = cpu.F.getValue()&0x10
    f |= 0x20;
    let tbit = cpu.A.getValue()&0x02;
    if(!tbit) {
      f |=0x80;
    }
    cpu.F.setValue(f);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[128] = {
  mnemonic: "RES 0, B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.B.setValue(cpu.B.getValue()&0xFE);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[129] = {
  mnemonic: "RES 0, C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.C.setValue(cpu.C.getValue()&0xFE);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[130] = {
  mnemonic: "RES 0, D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.D.setValue(cpu.D.getValue()&0xFE);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[131] = {
  mnemonic: "RES 0, E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.E.setValue(cpu.E.getValue()&0xFE);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[132] = {
  mnemonic: "RES 0, H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.H.setValue(cpu.H.getValue()&0xFE);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[133] = {
  mnemonic: "RES 0, L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.L.setValue(cpu.L.getValue()&0xFE);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[134] = {
  mnemonic: "RES 0, (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = cpu.mem.readByte(HL);
    cpu.mem.writeByte(HL,val&0xFE);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[135] = {
  mnemonic: "RES 0, A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.A.setValue(cpu.A.getValue()&0xFE);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[136] = {
  mnemonic: "RES 1, B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.B.setValue(cpu.B.getValue()&0xFD);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[137] = {
  mnemonic: "RES 1, C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.C.setValue(cpu.C.getValue()&0xFD);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[138] = {
  mnemonic: "RES 1, D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.D.setValue(cpu.D.getValue()&0xFD);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[139] = {
  mnemonic: "RES 1, E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.E.setValue(cpu.E.getValue()&0xFD);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[140] = {
  mnemonic: "RES 1, H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.H.setValue(cpu.H.getValue()&0xFD);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[141] = {
  mnemonic: "RES 1, L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.L.setValue(cpu.L.getValue()&0xFD);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[142] = {
  mnemonic: "RES 1, (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = cpu.mem.readByte(HL);
    cpu.mem.writeByte(HL,val&0xFD);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[143] = {
  mnemonic: "RES 1, A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.A.setValue(cpu.A.getValue()&0xFD);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[144] = {
  mnemonic: "RES 2, B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.B.setValue(cpu.B.getValue()&0xFB);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[145] = {
  mnemonic: "RES 2, C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.C.setValue(cpu.C.getValue()&0xFB);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[146] = {
  mnemonic: "RES 2, D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.D.setValue(cpu.D.getValue()&0xFB);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[147] = {
  mnemonic: "RES 2, E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.E.setValue(cpu.E.getValue()&0xFB);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[148] = {
  mnemonic: "RES 2, H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.H.setValue(cpu.H.getValue()&0xFB);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[149] = {
  mnemonic: "RES 2, L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.L.setValue(cpu.L.getValue()&0xFB);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[150] = {
  mnemonic: "RES 2, (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = cpu.mem.readByte(HL);
    cpu.mem.writeByte(HL,val&0xFB);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[151] = {
  mnemonic: "RES 2, A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.A.setValue(cpu.A.getValue()&0xFB);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[152] = {
  mnemonic: "RES 3, B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.B.setValue(cpu.B.getValue()&0xF7);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[153] = {
  mnemonic: "RES 3, C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.C.setValue(cpu.C.getValue()&0xF7);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[154] = {
  mnemonic: "RES 3, D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.D.setValue(cpu.D.getValue()&0xF7);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[155] = {
  mnemonic: "RES 3, E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.E.setValue(cpu.E.getValue()&0xF7);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[156] = {
  mnemonic: "RES 3, H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.H.setValue(cpu.H.getValue()&0xF7);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[157] = {
  mnemonic: "RES 3, L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.L.setValue(cpu.L.getValue()&0xF7);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[158] = {
  mnemonic: "RES 3, (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = cpu.mem.readByte(HL);
    cpu.mem.writeByte(HL,val&0xF7);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[159] = {
  mnemonic: "RES 3, A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.A.setValue(cpu.A.getValue()&0xF7);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[160] = {
  mnemonic: "RES 4, B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.B.setValue(cpu.B.getValue()&0xEF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[161] = {
  mnemonic: "RES 4, C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.C.setValue(cpu.C.getValue()&0xEF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[162] = {
  mnemonic: "RES 4, D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.D.setValue(cpu.D.getValue()&0xEF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[163] = {
  mnemonic: "RES 4, E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.E.setValue(cpu.E.getValue()&0xEF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[164] = {
  mnemonic: "RES 4, H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.H.setValue(cpu.H.getValue()&0xEF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[165] = {
  mnemonic: "RES 4, L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.L.setValue(cpu.L.getValue()&0xEF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[166] = {
  mnemonic: "RES 4, (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = cpu.mem.readByte(HL);
    cpu.mem.writeByte(HL,val&0xEF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[167] = {
  mnemonic: "RES 4, A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.A.setValue(cpu.A.getValue()&0xEF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[168] = {
  mnemonic: "RES 5, B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.B.setValue(cpu.B.getValue()&0xDF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[169] = {
  mnemonic: "RES 5, C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.C.setValue(cpu.C.getValue()&0xDF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[170] = {
  mnemonic: "RES 5, D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.D.setValue(cpu.D.getValue()&0xDF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[171] = {
  mnemonic: "RES 5, E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.E.setValue(cpu.E.getValue()&0xDF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[172] = {
  mnemonic: "RES 5, H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.H.setValue(cpu.H.getValue()&0xDF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[173] = {
  mnemonic: "RES 5, L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.L.setValue(cpu.L.getValue()&0xDF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[174] = {
  mnemonic: "RES 5, (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = cpu.mem.readByte(HL);
    cpu.mem.writeByte(HL,val&0xDF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[175] = {
  mnemonic: "RES 5, A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.A.setValue(cpu.A.getValue()&0xDF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[176] = {
  mnemonic: "RES 6, B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.B.setValue(cpu.B.getValue()&0xBF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[177] = {
  mnemonic: "RES 6, C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.C.setValue(cpu.C.getValue()&0xBF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[178] = {
  mnemonic: "RES 6, D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.D.setValue(cpu.D.getValue()&0xBF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[179] = {
  mnemonic: "RES 6, E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.E.setValue(cpu.E.getValue()&0xBF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[180] = {
  mnemonic: "RES 6, H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.H.setValue(cpu.H.getValue()&0xBF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[181] = {
  mnemonic: "RES 6, L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.L.setValue(cpu.L.getValue()&0xBF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[182] = {
  mnemonic: "RES 6, (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = cpu.mem.readByte(HL);
    cpu.mem.writeByte(HL,val&0xBF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[183] = {
  mnemonic: "RES 6, A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.A.setValue(cpu.A.getValue()&0xBF);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[184] = {
  mnemonic: "RES 7, B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.B.setValue(cpu.B.getValue()&0x7F);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[185] = {
  mnemonic: "RES 7, C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.C.setValue(cpu.C.getValue()&0x7F);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[186] = {
  mnemonic: "RES 7, D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.D.setValue(cpu.D.getValue()&0x7F);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[187] = {
  mnemonic: "RES 7, E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.E.setValue(cpu.E.getValue()&0x7F);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[188] = {
  mnemonic: "RES 7, H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.H.setValue(cpu.H.getValue()&0x7F);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[189] = {
  mnemonic: "RES 7, L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.L.setValue(cpu.L.getValue()&0x7F);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[190] = {
  mnemonic: "RES 7, (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = cpu.mem.readByte(HL);
    cpu.mem.writeByte(HL,val&0x7F);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[191] = {
  mnemonic: "RES 7, A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.A.setValue(cpu.A.getValue()&0x7F);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[192] = {
  mnemonic: "SET 0, B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.B.setValue(cpu.B.getValue()|0x01);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[193] = {
  mnemonic: "SET 0, C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.C.setValue(cpu.C.getValue()|0x01);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[194] = {
  mnemonic: "SET 0, D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.D.setValue(cpu.D.getValue()|0x01);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[195] = {
  mnemonic: "SET 0, E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.E.setValue(cpu.E.getValue()|0x01);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[196] = {
  mnemonic: "SET 0, H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.H.setValue(cpu.H.getValue()|0x01);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[197] = {
  mnemonic: "SET 0, L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.L.setValue(cpu.L.getValue()|0x01);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[198] = {
  mnemonic: "SET 0, (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = cpu.mem.readByte(HL);
    cpu.mem.writeByte(HL,val|0x01);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[199] = {
  mnemonic: "SET 0, A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.A.setValue(cpu.A.getValue()|0x01);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[200] = {
  mnemonic: "SET 1, B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.B.setValue(cpu.B.getValue()|0x02);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[201] = {
  mnemonic: "SET 1, C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.C.setValue(cpu.C.getValue()|0x02);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[202] = {
  mnemonic: "SET 1, D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.D.setValue(cpu.D.getValue()|0x02);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[203] = {
  mnemonic: "SET 1, E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.E.setValue(cpu.E.getValue()|0x02);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[204] = {
  mnemonic: "SET 1, H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.H.setValue(cpu.H.getValue()|0x02);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[205] = {
  mnemonic: "SET 1, L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.L.setValue(cpu.L.getValue()|0x02);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[206] = {
  mnemonic: "SET 1, (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = cpu.mem.readByte(HL);
    cpu.mem.writeByte(HL,val|0x02);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[207] = {
  mnemonic: "SET 1, A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.A.setValue(cpu.A.getValue()|0x02);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[208] = {
  mnemonic: "SET 2, B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.B.setValue(cpu.B.getValue()|0x04);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[209] = {
  mnemonic: "SET 2, C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.C.setValue(cpu.C.getValue()|0x04);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[210] = {
  mnemonic: "SET 2, D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.D.setValue(cpu.D.getValue()|0x04);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[211] = {
  mnemonic: "SET 2, E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.E.setValue(cpu.E.getValue()|0x04);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[212] = {
  mnemonic: "SET 2, H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.H.setValue(cpu.H.getValue()|0x04);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[213] = {
  mnemonic: "SET 2, L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.L.setValue(cpu.L.getValue()|0x04);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[214] = {
  mnemonic: "SET 2, (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = cpu.mem.readByte(HL);
    cpu.mem.writeByte(HL,val|0x04);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[215] = {
  mnemonic: "SET 2, A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.A.setValue(cpu.A.getValue()|0x04);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[216] = {
  mnemonic: "SET 3, B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.B.setValue(cpu.B.getValue()|0x08);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[217] = {
  mnemonic: "SET 3, C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.C.setValue(cpu.C.getValue()|0x08);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[218] = {
  mnemonic: "SET 3, D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.D.setValue(cpu.D.getValue()|0x08);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[219] = {
  mnemonic: "SET 3, E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.E.setValue(cpu.E.getValue()|0x08);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[220] = {
  mnemonic: "SET 3, H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.H.setValue(cpu.H.getValue()|0x08);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[221] = {
  mnemonic: "SET 3, L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.L.setValue(cpu.L.getValue()|0x08);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[222] = {
  mnemonic: "SET 3, (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = cpu.mem.readByte(HL);
    cpu.mem.writeByte(HL,val|0x08);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[223] = {
  mnemonic: "SET 3, A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.A.setValue(cpu.A.getValue()|0x08);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[224] = {
  mnemonic: "SET 4, B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.B.setValue(cpu.B.getValue()|0x10);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[225] = {
  mnemonic: "SET 4, C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.C.setValue(cpu.C.getValue()|0x10);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[226] = {
  mnemonic: "SET 4, D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.D.setValue(cpu.D.getValue()|0x10);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[227] = {
  mnemonic: "SET 4, E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.E.setValue(cpu.E.getValue()|0x10);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[228] = {
  mnemonic: "SET 4, H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.H.setValue(cpu.H.getValue()|0x10);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[229] = {
  mnemonic: "SET 4, L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.L.setValue(cpu.L.getValue()|0x10);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[230] = {
  mnemonic: "SET 4, (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = cpu.mem.readByte(HL);
    cpu.mem.writeByte(HL,val|0x10);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[231] = {
  mnemonic: "SET 4, A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.A.setValue(cpu.A.getValue()|0x10);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[232] = {
  mnemonic: "SET 5, B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.B.setValue(cpu.B.getValue()|0x20);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[233] = {
  mnemonic: "SET 5, C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.C.setValue(cpu.C.getValue()|0x20);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[234] = {
  mnemonic: "SET 5, D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.D.setValue(cpu.D.getValue()|0x20);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[235] = {
  mnemonic: "SET 5, E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.E.setValue(cpu.E.getValue()|0x20);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[236] = {
  mnemonic: "SET 5, H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.H.setValue(cpu.H.getValue()|0x20);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[237] = {
  mnemonic: "SET 5, L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.L.setValue(cpu.L.getValue()|0x20);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[238] = {
  mnemonic: "SET 5, (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = cpu.mem.readByte(HL);
    cpu.mem.writeByte(HL,val|0x20);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[239] = {
  mnemonic: "SET 5, A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.A.setValue(cpu.A.getValue()|0x20);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[240] = {
  mnemonic: "SET 6, B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.B.setValue(cpu.B.getValue()|0x40);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[241] = {
  mnemonic: "SET 6, C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.C.setValue(cpu.C.getValue()|0x40);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[242] = {
  mnemonic: "SET 6, D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.D.setValue(cpu.D.getValue()|0x40);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[243] = {
  mnemonic: "SET 6, E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.E.setValue(cpu.E.getValue()|0x40);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[244] = {
  mnemonic: "SET 6, H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.H.setValue(cpu.H.getValue()|0x40);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[245] = {
  mnemonic: "SET 6, L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.L.setValue(cpu.L.getValue()|0x40);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[246] = {
  mnemonic: "SET 6, (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = cpu.mem.readByte(HL);
    cpu.mem.writeByte(HL,val|0x40);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[247] = {
  mnemonic: "SET 6, A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.A.setValue(cpu.A.getValue()|0x40);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[248] = {
  mnemonic: "SET 7, B",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.B.setValue(cpu.B.getValue()|0x80);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[249] = {
  mnemonic: "SET 7, C",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.C.setValue(cpu.C.getValue()|0x80);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[250] = {
  mnemonic: "SET 7, D",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.D.setValue(cpu.D.getValue()|0x80);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[251] = {
  mnemonic: "SET 7, E",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.E.setValue(cpu.E.getValue()|0x80);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[252] = {
  mnemonic: "SET 7, H",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.H.setValue(cpu.H.getValue()|0x80);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[253] = {
  mnemonic: "SET 7, L",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.L.setValue(cpu.L.getValue()|0x80);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[254] = {
  mnemonic: "SET 7, (HL)",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    let HL = (cpu.H.getValue()<<8)|(cpu.L.getValue());
    let val = cpu.mem.readByte(HL);
    cpu.mem.writeByte(HL,val|0x80);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
opcodes_CB[255] = {
  mnemonic: "SET 7, A",
  blength: 2,
  m_cycle: 2,
  t_cycle: 8,
  exec: function(cpu) {
    cpu.A.setValue(cpu.A.getValue()|0x80);
    cpu._clock.m+=this.m_cycle;
    cpu._clock.t+=this.t_cycle;
    cpu.PC.addValue(this.blength);
  }
}
export default opcodes;
