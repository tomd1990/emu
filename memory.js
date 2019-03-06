
// 0x0000-0x3FFF: Permanently-mapped ROM bank.
// 0x4000-0x7FFF: Area for switchable ROM banks.
// 0x8000-0x9FFF: Video RAM.
// 0xA000-0xBFFF: Area for switchable external RAM banks.
// 0xC000-0xCFFF: Game Boy’s working RAM bank 0 .
// 0xD000-0xDFFF: Game Boy’s working RAM bank 1.
// 0xFE00-0xFEFF: Sprite Attribute Table.
// 0xFF00-0xFF7F: Devices’ Mappings. Used to access I/O devices.
// 0xFF80-0xFFFE: High RAM Area.
// 0xFFFF: Interrupt Enable Register.
//signed or unsigned
export default class MMU {
  constructor() {
    //biosloaded 1 if bios loaded 0 if not shares the same space with ROM
    this.biosloaded = 1;
    //find code for nintendo bios only 0xFF big
    //0x0000 - 0x00FF
    this._bios = new Uint8Array(0x0100);
    this._bios.fill(0);
    //0x0000-0x7FFF
    this._rom = new Uint8Array(0x8000);
    this._rom.fill(0);
    //0x8000-0x9FFF
    this._vram = new Uint8Array(0x2000);
    this._vram.fill(0);
    //0xA000 - 0xBFFF
    this._eram = new Uint8Array(0x2000);
    this._eram.fill(0);
    //0xC000 - 0xDFFF also must redirect shadow area to here **0xE000-0xFDFF**
    this._wram = new Uint8Array(0x2000);
    this._wram.fill(0);
    //0xFE00 - 0xFE9F
    this._sprites = new Uint8Array(0x00A0);
    this._sprites.fill(0);
    //0xFEA0 - FF00 ?????
    //0xFF00 - 0xFF7F
    this._io = new Uint8Array(0x0080);
    this._io.fill(0);
    //0xFF80-0xFFFF
    this._zram = new Uint8Array(0x0080);
    this._zram.fill(0);
  }

  readByte(address) {
    switch (address&0xF000) {
      //unhandled bios scenario
      case 0x0000:
      case 0x1000:
      case 0x2000:
      case 0x3000:
      case 0x4000:
      case 0x5000:
      case 0x6000:
      case 0x7000:
        return this._rom[address];
      case 0x8000:
      case 0x9000:
        return this._vram[address&0x1FFF];
      case 0xA000:
      case 0xB000:
        return this._eram[address&0x1FFF];
      case 0xC000:
      case 0xD000:
      case 0xE000:
        return this._wram[address&0x1FFF];
      //distinguish between echo wram, zram, and io
      case 0xF000:
        switch(address&0x0F00) {
          case 0x0000:
          case 0x0100:
          case 0x0200:
          case 0x0300:
          case 0x0400:
          case 0x0500:
          case 0x0600:
          case 0x0700:
          case 0x0800:
          case 0x0900:
          case 0x0A00:
          case 0x0B00:
          case 0x0C00:
          case 0x0D00:
            return this._wram[address&0x1FFF];
          case 0x0E00:
            if(address<0xFEA0) {
              return this._sprites[address&0x00FF];
            }
            else {
              return 0;
            }
          case 0x0F00:
            if(address>=0xFF80) {
              return this._zram[address&0x007F];
            }
            else {
              //0xFF00 - 0xFF7F
              return this._io[address&0x007F];
            }

        }
    }
  }

  writeByte(address, byte) {
    switch (address&0xF000) {
      case 0x0000:

      case 0x1000:
      case 0x2000:
      case 0x3000:
      case 0x4000:
      case 0x5000:
      case 0x6000:
      case 0x7000:
        this._rom[address] = byte;
        break;
      case 0x8000:
      case 0x9000:
        this._vram[address&0x1FFF] = byte;
        break;
      case 0xA000:
      case 0xB000:
        this._eram[address&0x1FFF] = byte;
        break;
      case 0xC000:
      case 0xD000:
      case 0xE000:
        this._wram[address&0x1FFF] = byte;
        break;
      //distinguish between echo wram, zram, and io
      case 0xF000:
        switch(address&0x0F00) {
          case 0x0000:
          case 0x0100:
          case 0x0200:
          case 0x0300:
          case 0x0400:
          case 0x0500:
          case 0x0600:
          case 0x0700:
          case 0x0800:
          case 0x0900:
          case 0x0A00:
          case 0x0B00:
          case 0x0C00:
          case 0x0D00:
            this._wram[address&0x1FFF] = byte;
          case 0x0E00:
            if(address<0xFEA0) {
              this._sprites[address&0x00FF] = byte;
              break;
            }
            else {
              break;
            }
          case 0x0F00:
            if(address>=0xFF80) {
              this._zram[address&0x007F] = byte;
              break;
            }
            else {
              //0xFF00 - 0xFF7F
              this._io[address&0x007F] = byte;
              break;
            }

        }
    }
  }
}

//exports.MMU = MMU;
