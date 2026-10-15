/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 *
 * Mekari Talenta API - SuiteScript 2.1 Employee & Payroll Sync
 * Fetches updated employee records from Talenta and upserts them into NetSuite Employee records.
 */
define(['N/record', 'N/search', 'N/log', './talenta_hmac_service'], (record, search, log, talentaService) => {

    // Config - Can also be stored in Script Parameters or NetSuite Company Preferences
    const CONFIG = {
        baseUrl: 'https://api.mekari.com',
        clientId: 'YOUR_CLIENT_ID',
        clientSecret: 'YOUR_CLIENT_SECRET'
    };

    /**
     * getInputData: Fetches active employees from Mekari Talenta API
     */
    function getInputData() {
        log.audit('Talenta Sync', 'Starting Employee Sync from Mekari Talenta Data API...');

        try {
            const response = talentaService.sendRequest({
                baseUrl: CONFIG.baseUrl,
                method: 'GET',
                pathWithQuery: '/v2/talenta/v3/employees?limit=100&page=1',
                clientId: CONFIG.clientId,
                clientSecret: CONFIG.clientSecret
            });

            if (response.code !== 200) {
                log.error('Talenta API Error', `Status ${response.code}: ${response.body}`);
                return [];
            }

            const data = JSON.parse(response.body);
            const employees = (data && data.data) ? data.data : [];
            log.audit('Talenta Sync', `Fetched ${employees.length} employees from Talenta.`);
            return employees;

        } catch (e) {
            log.error('getInputData Failed', e.toString());
            return [];
        }
    }

    /**
     * map: Process each employee record and match with NetSuite Employee by employee_id or email
     */
    function map(context) {
        const empData = JSON.parse(context.value);
        const talentaEmployeeId = empData.employee_id || empData.id;
        const email = empData.email || '';
        const firstName = empData.first_name || '';
        const lastName = empData.last_name || '';

        try {
            // Find existing NetSuite employee record
            let nsEmpId = null;
            if (email) {
                const empSearch = search.create({
                    type: search.Type.EMPLOYEE,
                    filters: [['email', 'is', email]],
                    columns: ['internalid']
                });
                empSearch.run().each(result => {
                    nsEmpId = result.id;
                    return false;
                });
            }

            let empRecord;
            if (nsEmpId) {
                empRecord = record.load({
                    type: record.Type.EMPLOYEE,
                    id: nsEmpId,
                    isDynamic: true
                });
                log.audit('Sync Employee', `Updating existing NetSuite Employee ID: ${nsEmpId}`);
            } else {
                empRecord = record.create({
                    type: record.Type.EMPLOYEE,
                    isDynamic: true
                });
                log.audit('Sync Employee', `Creating new NetSuite Employee for ${email}`);
            }

            empRecord.setValue({ fieldId: 'firstname', value: firstName });
            empRecord.setValue({ fieldId: 'lastname', value: lastName || firstName });
            if (email) empRecord.setValue({ fieldId: 'email', value: email });

            // Store Talenta ID in custom field
            // empRecord.setValue({ fieldId: 'custentity_talenta_id', value: talentaEmployeeId.toString() });

            const savedId = empRecord.save({ ignoreMandatoryFields: true });
            log.audit('Sync Success', `Saved Employee record: ${savedId}`);

        } catch (err) {
            log.error('Failed to sync employee', `Talenta ID ${talentaEmployeeId}: ${err.toString()}`);
        }
    }

    function summarize(summary) {
        log.audit('Talenta Sync Summary', 'Completed synchronization cycle.');
    }

    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };
});
