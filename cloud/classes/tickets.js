class Tickets extends Parse.Object {
  constructor() {
    super('Tickets');
  }

  static async getTickets() {
    try {
      console.log('getTickets - init');
      const query = new Parse.Query(Tickets);
      query.equalTo('objectId', 'uFfpzk5juu');
      const result = await query.find();
      console.log('getTickets - end');
      return result;
    } catch (error) {
      throw error;
    }
  }
}
Parse.Object.registerSubclass('Tickets', Tickets);

module.exports = Tickets;
