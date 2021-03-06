import {Router, Request, Response} from 'express';
import * as _ from 'underscore';
import {CustomerModel} from '../database/models/customer.model';
import {AllInvoiceModel, RecentInvoiceModel} from '../database/models/invoice.model';
declare var Date: any;
import {ProductModel} from '../database/models/product.model';
import * as path from "path";
import * as fs from "fs";
import * as BusBoy from "busboy";

export class InvoiceController {
    constructor() {
    }

    static removeInvoice(res: Response, data) {
        res.send(data);
    }

    static createNewInvoice(res: Response, data) {
        let invoice = new AllInvoiceModel({
            customer_id: data.customer_id,
            payment_due_date: data.date,
            amount_due: data.total,
            status: data.status,
            total: data.total,
            discount: data.discount,
            invoice_created_date: data.date,
            productList: data.productList,
            created_on: data.date,
            type: "all"
        });

        invoice.save(function (err, data) {
            if (!err) {
                res.send(data);
            } else {
                res.send({status: false});
            }
        });
    }

    static getInvoiceByCustomerId(res: Response, id) {
        let res_data = [];
        AllInvoiceModel.find({customer_id: id}, (err, data) => {
            if (!err) {
                let res_data = data;
                RecentInvoiceModel.findOne({customer_id: id}, (err, data) => {
                    if (!err) {
                        res_data.push(data);
                        res.send(res_data);
                    } else {
                        res.send({status: false});
                    }
                })
            } else {
                res.send({status: false});
            }
        });
    }

    static globalSearchByCustomer(res: Response, text: any) {
        //get customer name from ids
        let query = CustomerModel.find(
            {
                $or: [
                    {
                        "username": {
                            $regex: ".*" + text + ".*",
                            $options: "i"
                        }
                    },
                    {
                        "fullname": {
                            $regex: ".*" + text + ".*",
                            $options: "i"
                        }
                    }
                ]
            }, ["username", "fullname"]);

        query.exec((err, data) => {
            if (!err) {
                res.send(data);
            } else {
                res.send({status: false});
            }
        })
    }

    static saveAutoInvoice(res: Response, req: Request) {
        var base64Data = req.body.pdf;
        var imageBuffer = InvoiceController.decodeBase64Image(base64Data);
        var filename = req.body.label + '.pdf';

        //get current month name and make dir
        var d = new Date();
        var month = new Array();
        month[0] = "January";
        month[1] = "February";
        month[2] = "March";
        month[3] = "April";
        month[4] = "May";
        month[5] = "June";
        month[6] = "July";
        month[7] = "August";
        month[8] = "September";
        month[9] = "October";
        month[10] = "November";
        month[11] = "December";
        var dirname = month[d.getMonth()];

        var dir_path = path.join(__dirname, "../../../", dirname);

        if (!fs.existsSync(dir_path)) {
            fs.mkdirSync(dir_path);
        }

        var saveTo = path.join(__dirname, "../../../", dirname, filename);
        fs.writeFile(saveTo, imageBuffer["data"], function (err) {
            if (!err) {
                res.send({status: true});
            } else {
                res.send({status: false});
            }
        });
    }

    static decodeBase64Image(dataString) {
        var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
            response = {};
        if (matches.length !== 3) {
            return new Error('Invalid input string');
        }
        response['type'] = matches[1];
        response['data'] = new Buffer(matches[2], 'base64');
        return response;
    }

    static getAllInvoiceCount(res: Response) {
        AllInvoiceModel.count((err, c) => {
            if (!err) {
                res.send({count: c});
            } else {
                res.send({count: 0});
            }
        })
    }

    static getRecentInvoiceCustomers(res: Response) {
        CustomerModel.find({
            $and: [
                {status: true},
                {
                    productList: {
                        $exists: true, $not: {$size: 0}
                    }
                }
            ]
        }, function (err, data) {
            if (!err) {
                res.send(data);
            }
        });
    }

    static storeInvoice(res: Response, data: any) {
        let invoice = new AllInvoiceModel({
            customer_id: data.customer_id,
            payment_due_date: data.payment_due_date,
            amount_due: data.amount_due,
            status: data.status,
            total: data.total,
            discount: data.discount,
            invoice_created_date: data.invoice_created_date,
            paid_date: data.paid_date,
            amount_partially_paid: data.amount_partially_paid,
            productList: data.productList,
            type: "all"
        });

        invoice.save(function (err, data) {
            if (err) {
                res.send({status: false});
            } else {
                res.send({status: true, id: data._id});
            }
        });
    }

    static generateInvoice(res: Response, data: any) {
        res.send(data);
    }

    static getInvoiceById(res: Response, type, id) {
        if (type == 'recent') {
            RecentInvoiceModel.findById(id, function (err, data) {
                res.send(data);
            })
        }
        else if (type == 'all') {
            AllInvoiceModel.findById(id, function (err, data) {
                res.send(data);
            })
        } else {
            res.send({status: false});
        }

    }

    static searchByUsername(res: Response, data: any) {
        AllInvoiceModel.find({"username": {$regex: ".*" + data.text + ".*", $options: 'i'}}, function (err, data) {
            if (!err) {
                res.send(data);
            }
        });
    }

    static saveRecentInvoice(res: Response, data: any) {
        let invoice = new RecentInvoiceModel({
            customer_id: data.customer_id,
            payment_due_date: data.payment_due_date,
            amount_due: data.amount_due,
            status: data.status,
            total: data.total,
            discount: data.discount,
            paid_date: data.paid_date,
            amount_partially_paid: data.amount_partially_paid,
            productList: data.productList,
            type: "recent"
        });

        invoice.save(function (err, data) {
            if (err) {
                res.send({status: false});
            } else {
                res.send({status: true, id: data._id});
            }
        });
    }

    static dropRecentInvoiceAll(res: Response) {
        if (RecentInvoiceModel.collection.drop()) {
            res.send({status: true});
        } else {
            res.send({status: false});
        }
    }

    static checkRecentInvoiceExists(res: Response) {
        RecentInvoiceModel.count({}, function (err, count) {
            res.send({"count": count});
        });
    }

    static getRecentInvoiceDB(res: Response, paginationCount: number) {
        let skip_count = (paginationCount - 1) * 30;
        RecentInvoiceModel.find({}).skip(skip_count).limit(30).exec((err, data) => {
            if (!err) {
                res.send(data);
            } else {
                res.send({status: false});
            }
        })
    }

    static cleanInvoice(res: Response) {
        let isClean: boolean = false;
        let date = new Date();
        let firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        RecentInvoiceModel.find({
                "created_on": {
                    $lt: firstDay
                }
            }, (err, data) => {
                if (data.length <= 0) {
                    res.send({"status": false});
                }
                _.each(data, (obj) => {
                    // clean from recent and push to all
                    isClean = true;
                    let invoice = new AllInvoiceModel({
                        recent_id: obj['_id'],
                        customer_id: obj['customer_id'],
                        payment_due_date: obj['payment_due_date'],
                        amount_due: obj['amount_due'],
                        status: obj['status'],
                        total: obj['total'],
                        discount: obj['discount'],
                        invoice_created_date: obj['invoice_created_date'],
                        paid_date: obj['paid_date'],
                        amount_partially_paid: obj['amount_partially_paid'],
                        productList: obj['productList'],
                        created_on: obj['created_on']
                    });

                    invoice.save(function (err, newData) {
                        if (!err) {
                            RecentInvoiceModel.findOne({'_id': newData['recent_id']}).remove(function (err) {
                                if (!err) {
                                    isClean = true;
                                    CustomerModel.findOne({
                                            $and: [
                                                {
                                                    '_id': newData['customer_id']
                                                },
                                                {
                                                    'status': true
                                                }
                                            ]
                                        }, function (err, customer) {
                                            if (customer) {
                                                let date = new Date();
                                                let firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                                                let newInvoice = new RecentInvoiceModel({
                                                    customer_id: customer['_id'],
                                                    payment_due_date: firstDay,
                                                    amount_due: 0,
                                                    status: 'Due',
                                                    total: 0,
                                                    discount: 0,
                                                    amount_partially_paid: [],
                                                    productList: customer['productList']
                                                });
                                                ProductModel.find({"_id": {"$in": customer['productList']}}, function (err, docs) {
                                                    _.each(docs, (item) => {
                                                        newInvoice['total'] += item['rate'];
                                                    });
                                                    newInvoice['amount_due'] = newInvoice['total'];
                                                    newInvoice.save(function () {
                                                        // console.log(data);
                                                    });
                                                });
                                            }
                                        }
                                    );
                                }
                            });
                        } else {
                            res.send({status: 'error in invoice save'});
                        }
                    });
                });
            },
            () => {
                res.send({"status": isClean});
            });
    }

    static changeStatus(res: Response, data: any) {
        if (data['type'] == 'recent') {
            RecentInvoiceModel.update({_id: data['_id']}, {
                $set: {
                    customer_id: data['customer_id'],
                    payment_due_date: data['payment_due_date'],
                    amount_due: data['amount_due'],
                    status: data['status'],
                    total: data['total'],
                    discount: data['discount'],
                    invoice_created_date: data['invoice_created_date'],
                    paid_date: data['paid_date'],
                    amount_partially_paid: data['amount_partially_paid'],
                    productList: data['productList']
                }
            }, function (err) {
                if (err) {
                    res.send({status: false});
                } else {
                    res.send({status: true});
                }
            })
        } else {
            AllInvoiceModel.update({_id: data['_id']}, {
                $set: {
                    customer_id: data['customer_id'],
                    payment_due_date: data['payment_due_date'],
                    amount_due: data['amount_due'],
                    status: data['status'],
                    total: data['total'],
                    discount: data['discount'],
                    invoice_created_date: data['invoice_created_date'],
                    paid_date: data['paid_date'],
                    amount_partially_paid: data['amount_partially_paid'],
                    productList: data['productList'],
                    type: "all"
                }
            }, function (err) {
                if (err) {
                    res.send({status: false});
                } else {
                    res.send({status: true});
                }
            })
        }
    }

    static buildAndSaveRecentInvoice(res: Response) {
        CustomerModel.find({
                $and: [
                    {
                        productList: {
                            $exists: true, $not: {$size: 0}
                        }
                    },
                    {
                        status: true
                    }
                ]
            },
            function (err, data) {
                let date = new Date();
                let firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                _.each(data, (customer) => {
                    let invoice = new RecentInvoiceModel({
                        customer_id: customer['_id'],
                        payment_due_date: firstDay,
                        amount_due: 0,
                        status: 'Due',
                        total: 0,
                        discount: 0,
                        amount_partially_paid: [],
                        productList: customer['productList'],
                        type: 'recent'
                    });

                    ProductModel.find({"_id": {"$in": customer['productList']}}, function (err, docs) {
                        _.each(docs, (item) => {
                            invoice['total'] += item['rate'];
                        });
                        invoice['amount_due'] = invoice['total'];
                        invoice.save(function () {
                            // console.log(data);
                        });
                    });
                });
                res.send({status: true});
            }
    }

    static savePartialPay(res: Response, data: any) {
        let pay_data = {
            date: Date.now(),
            amount: data['amount_partially_paid']
        };
        RecentInvoiceModel.findByIdAndUpdate(
            data['id'],
            {$push: {"amount_partially_paid": {date: pay_data['date'], amount: pay_data['amount']}}},
            {safe: true, upsert: true, new: true},
            function (err, docs) {
                let total_partial_pay = 0;
                _.each(docs['amount_partially_paid'], (item) => {
                    total_partial_pay += item['amount'];
                });
                if (total_partial_pay >= docs['total']) {
                    RecentInvoiceModel.update({_id: data['id']}, {
                        $set: {
                            status: 'Paid',
                            amount_due: 0,
                            paid_date: Date.now()
                        }
                    }, function (err) {
                        if (err) {
                            res.send({status: false});
                        } else {
                            res.send({status: true});
                        }
                    });
                } else {
                    RecentInvoiceModel.update({_id: data['id']}, {
                        $set: {
                            status: 'Partially Paid',
                            amount_due: docs['total'] - total_partial_pay
                        }
                    }, function (err) {
                        if (err) {
                            res.send({status: false});
                        } else {
                            res.send({status: true});
                        }
                    });
                }

            }
        );
    }

    static preGenerateUpdate(res: Response, data: any) {
        if (data['type'] == 'recent') {
            RecentInvoiceModel.update({_id: data.id}, {
                $set: {
                    amount_due: data.amount_due,
                    discount: data.discount,
                    productList: data.productList,
                    total: data.total,
                    amount_partially_paid: data.amount_partially_paid
                }
            }, function (err) {
                if (err) {
                    res.send({status: false});
                } else {
                    res.send({status: true});
                }
            });
        }
        else if (data['type'] == 'all') {
            AllInvoiceModel.update({_id: data.id}, {
                $set: {
                    amount_due: data.amount_due,
                    discount: data.discount,
                    productList: data.productList,
                    total: data.total,
                    amount_partially_paid: data.amount_partially_paid,
                }
            }, function (err) {
                if (err) {
                    res.send({status: false});
                } else {
                    res.send({status: true});
                }
            });
        }
        else {
            res.send({status: false});
        }
    }

    static deleteInvoice(res: Response, data) {
        if (data['type'] === 'recent') {
            RecentInvoiceModel.find({_id: data['_id']}).remove(function (err) {
                if (!err) {
                    res.send({status: true});
                } else {
                    res.send({status: false});
                }
            });
        } else {
            AllInvoiceModel.find({_id: data['_id']}).remove(function (err) {
                if (!err) {
                    res.send({status: true});
                } else {
                    res.send({status: false});
                }
            });
        }
    }

    static getAllInvoices(res: Response, paginationCount: number) {
        let skip_count = (paginationCount - 1) * 30;
        AllInvoiceModel.find({}).skip(skip_count).limit(30).exec((err, data) => {
            if (!err) {
                res.send(data);
            } else {
                res.send({status: false});
            }
        })
    }

}

