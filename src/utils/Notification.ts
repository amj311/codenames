export default class Notification {
  id: string;
  msg: string;
  type: string;
  aff: Object;
  neg: Object;
  sticky: boolean;

  constructor(props: any) {
    let { msg, aff, neg, sticky, type } = props;
    this.id = Date.now().toString()+Math.random()*10;
    this.msg = msg;
    this.type = type;
    this.aff = aff;
    this.neg = neg;
    this.sticky = sticky || false;
  }
}
