holvi_order_webhook_payload = {
    "code": "d3fc28d9d5e8f2489bf69c196a57b08d",
    "pool": "ybD2Fp",
    "purchases": [
        {
            "code": "af9bfad4403251d4ff9407904b2e9e60",
            "product": "20a8740bbc17daa64af1a14e85b1c5b3",
            "detailed_price": {
                "net": "0.00",
                "gross": "0.00",
                "vat_rate": "57ed3a56fad7b5c157c5c8b76059349b",
                "currency": "EUR"
            },
            "used": False,
            "answers": [],
            "detailed_original_price": {
                "net": "0.00",
                "gross": "0.00",
                "vat_rate": "57ed3a56fad7b5c157c5c8b76059349b",
                "currency": "EUR"
            },
            "product_name": "Shipping fee",
            "create_time": "2020-03-27T12:57:45.702Z",
            "update_time": "2020-03-27T12:57:45.702Z",
            "category": "3f583e75e7e4ff6c14f1dc3569a8b3c9",
            "image": None
        },
        {
            "code": "b7c7ed9f952945dfea61429e51894231",
            "product": "663846b000af40f693af247608c1a17f",
            "detailed_price": {
                "net": "8.00",
                "gross": "8.80",
                "vat_rate": "c80c390979b5e368278da7a54cf224de",
                "currency": "EUR"
            },
            "used": False,
            "answers": [
                {
                    "question": "7e27fead0b0c42b345d91c4936bd44a5",
                    "label": "* OHJEET KULJETTAJALLE: Kirjoita tänne tiedoksi: Jos on ovikoodia jne.",
                    "answer": "Watch your steps"
                },
                {
                    "question": "40f5dcea45e04a6f66f09de6ff755f53",
                    "label": "Toppings",
                    "answer": "ketchup, pinapple"
                }
            ],
            "detailed_original_price": {
                "net": "8.00",
                "gross": "8.80",
                "vat_rate": "c80c390979b5e368278da7a54cf224de",
                "currency": "EUR"
            },
            "product_name": "Tasty Pizza",
            "create_time": "2020-03-27T12:57:45.474Z",
            "update_time": "2020-03-27T12:57:45.474Z",
            "category": "3f583e75e7e4ff6c14f1dc3569a8b3c9",
            "image": None
        }
    ],
    "success_url": "",
    "failure_url": "",
    "cancel_url": "",
    "notification_url": "http://b93e881d.ngrok.io",
    "firstname": "Mark",
    "lastname": "Smith",
    "company": "",
    "eu_vat_identifier": "",
    "email": "mark@holvi.com",
    "city": "Helsinki",
    "country": "FI",
    "street": "Porthaninkatu 13",
    "postcode": "00530",
    "language": "en",
    "phone": "+35888445544",
    "paid": True,
    "create_time": "2020-03-27T12:57:45.442Z",
    "update_time": "2020-03-27T12:58:40.720Z",
    "paid_time": "2020-03-27T12:59:04.582Z",
    "processed": False,
    "processed_time": None,
    "discount_code": None,
    "country_code": "FI",
    "country_name": "Finland"
}

holvi_delivery_order_webhook_payload = dict(
    holvi_order_webhook_payload,
    purchases=holvi_order_webhook_payload['purchases'] + [{
        "answers": [],
        "product_name": "Kotiinkuljetus"
    }]
)
